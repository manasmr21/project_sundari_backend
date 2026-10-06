import { HTTPException } from "hono/http-exception";
import { PrismaClient } from "../../generated/prisma/client";
import {
    CreateOrderType,
    UpdateOrderType,
    OrderQueryType,
} from "./orders.validator";

const generateOrderId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const entropy = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
    return `ORD-${timestamp}-${entropy}`;
};

export const createOrder = async (data: CreateOrderType, prisma: PrismaClient) => {
    const [user, address] = await Promise.all([
        prisma.users.findUnique({ where: { id: data.userId } }),
        prisma.address.findUnique({ where: { id: data.addressId } }),
    ]);

    if (!user) {
        throw new HTTPException(404, { message: "User not found" });
    }

    if (!address) {
        throw new HTTPException(404, { message: "Address not found" });
    }

    if (address.userId !== data.userId) {
        throw new HTTPException(400, { message: "The specified delivery address does not belong to this user" });
    }

    // Collect product IDs and validate presence
    const productIds = data.products.map((p) => p.productId);
    const existingProducts = await prisma.products.findMany({
        where: { id: { in: productIds } },
    });

    const productMap = new Map(existingProducts.map((p) => [p.id, p]));

    for (const item of data.products) {
        const prod = productMap.get(item.productId);
        if (!prod) {
            throw new HTTPException(404, { message: `Product with ID '${item.productId}' not found` });
        }
        if (prod.stock < item.quantity) {
            throw new HTTPException(400, {
                message: `Insufficient stock for '${prod.name}'. Requested: ${item.quantity}, Available: ${prod.stock}`,
            });
        }
    }

    // Calculate item prices and order total
    let calculatedSubtotal = 0;
    const orderItemsData = data.products.map((item) => {
        const prod = productMap.get(item.productId)!;
        const itemPrice = item.price ?? prod.discountPrice ?? prod.price;
        const itemDiscount = item.discount ?? 0;
        const itemTotal = Math.max(0, (itemPrice - itemDiscount) * item.quantity);
        calculatedSubtotal += itemTotal;

        return {
            productId: item.productId,
            quantity: item.quantity,
            price: itemPrice,
            discount: itemDiscount,
            total: Math.round(itemTotal * 100) / 100,
        };
    });

    const orderDiscount = data.discount ?? 0;
    const finalTotal = Math.max(0, calculatedSubtotal - orderDiscount);

    // Create the order with retry loop for collision-free unique orderId
    let order: any;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        attempts++;
        const orderId = data.orderId ? data.orderId.trim() : generateOrderId();

        try {
            order = await prisma.orders.create({
                data: {
                    orderId,
                    userId: data.userId,
                    addressId: data.addressId,
                    price: Math.round(calculatedSubtotal * 100) / 100,
                    discount: Math.round(orderDiscount * 100) / 100,
                    total: Math.round(finalTotal * 100) / 100,
                    status: data.status ?? "pending",
                    paymentStatus: data.paymentStatus ?? "pending",
                    products: {
                        create: orderItemsData,
                    },
                },
                include: {
                    products: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    thumbnail: true,
                                    price: true,
                                    discountPrice: true,
                                },
                            },
                        },
                    },
                    address: true,
                    user: {
                        select: {
                            id: true,
                            fullname: true,
                            email: true,
                        },
                    },
                },
            });
            break;
        } catch (err) {
            if (data.orderId) {
                throw new HTTPException(409, { message: `Order with code '${data.orderId}' already exists` });
            }
            if (err instanceof Error && "code" in err && err.code === "P2002" && attempts < maxAttempts) {
                continue;
            }
            throw err;
        }
    }

    // Deduct stock for ordered products once order creation succeeds
    for (const item of data.products) {
        await prisma.products.update({
            where: { id: item.productId },
            data: {
                stock: { decrement: item.quantity },
            },
        });
    }

    // Optionally clear cart items for user
    if (data.clearCart) {
        await prisma.cart.deleteMany({
            where: {
                userId: data.userId,
                productId: { in: productIds },
            },
        });
    }

    return order;
};


export const getOrders = async (query: OrderQueryType, prisma: PrismaClient) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.userId) {
        where.userId = query.userId;
    }

    if (query.status) {
        where.status = query.status;
    }

    if (query.paymentStatus) {
        where.paymentStatus = query.paymentStatus;
    }

    if (query.search && query.search.trim()) {
        const search = query.search.trim();
        where.OR = [
            { orderId: { contains: search } },
            { user: { fullname: { contains: search } } },
            { user: { email: { contains: search } } },
        ];
    }

    const [total, orders] = await Promise.all([
        prisma.orders.count({ where }),
        prisma.orders.findMany({
            where,
            skip,
            take: limit,
            include: {
                products: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                thumbnail: true,
                                price: true,
                                discountPrice: true,
                            },
                        },
                    },
                },
                address: true,
                user: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return {
        orders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
};

/**
 * Retrieves an order by its unique public orderId string (e.g. 'ORD-123').
 */
export const getOrderByCode = async (orderId: string, prisma: PrismaClient) => {
    const order = await prisma.orders.findUnique({
        where: { orderId },
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            thumbnail: true,
                            price: true,
                            discountPrice: true,
                        },
                    },
                },
            },
            address: true,
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                },
            },
        },
    });

    if (!order) {
        throw new HTTPException(404, { message: `Order with code '${orderId}' not found` });
    }

    return order;
};

/**
 * Retrieves an order by its internal numeric ID.
 */
export const getOrderById = async (id: number, prisma: PrismaClient) => {
    const order = await prisma.orders.findUnique({
        where: { id },
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            thumbnail: true,
                            price: true,
                            discountPrice: true,
                        },
                    },
                },
            },
            address: true,
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                },
            },
        },
    });

    if (!order) {
        throw new HTTPException(404, { message: "Order not found" });
    }

    return order;
};

/**
 * Retrieves all orders for a specific user ID.
 */
export const getOrdersByUserId = async (userId: string, prisma: PrismaClient) => {
    const user = await prisma.users.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new HTTPException(404, { message: `User with ID '${userId}' not found` });
    }

    return await prisma.orders.findMany({
        where: { userId },
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            thumbnail: true,
                            price: true,
                            discountPrice: true,
                        },
                    },
                },
            },
            address: true,
        },
        orderBy: { createdAt: "desc" },
    });
};

/**
 * Updates an order status or payment status.
 * If status changes to 'cancelled', restocks the products.
 */
export const updateOrder = async (
    id: number,
    data: UpdateOrderType,
    prisma: PrismaClient
) => {
    const existing = await prisma.orders.findUnique({
        where: { id },
        include: { products: true },
    });

    if (!existing) {
        throw new HTTPException(404, { message: "Order not found" });
    }

    if (data.addressId !== undefined) {
        const address = await prisma.address.findUnique({
            where: { id: data.addressId },
        });
        if (!address) {
            throw new HTTPException(404, { message: `Address with ID '${data.addressId}' not found` });
        }
    }

    // Restock products if order is cancelled
    if (data.status === "cancelled" && existing.status !== "cancelled") {
        for (const item of existing.products) {
            await prisma.products.update({
                where: { id: item.productId },
                data: {
                    stock: { increment: item.quantity },
                },
            });
        }
    }

    return await prisma.orders.update({
        where: { id },
        data,
        include: {
            products: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            thumbnail: true,
                            price: true,
                            discountPrice: true,
                        },
                    },
                },
            },
            address: true,
            user: {
                select: {
                    id: true,
                    fullname: true,
                    email: true,
                },
            },
        },
    });
};

/**
 * Deletes an order by internal numeric ID.
 */
export const deleteOrder = async (id: number, prisma: PrismaClient) => {
    try {
        return await prisma.orders.delete({
            where: { id },
        });
    } catch (err) {
        if (err instanceof Error && "code" in err && err.code === "P2025") {
            throw new HTTPException(404, { message: "Order not found" });
        }
        throw err;
    }
};
