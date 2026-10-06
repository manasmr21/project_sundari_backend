import { Context, Next } from "hono";
import { Bindings } from "../index";
import { getSignedCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

export type User = {
    id: string
    fullname: string
    role: {
        id: number
        name: string
        slug: string
    }
    verified: boolean
    exp: number
}

export type Variables = {
    user: User
}

export const jwtMiddleware = async (c: Context<{ Bindings: Bindings, Variables: Variables }>, next: Next) => {
    const cookieSecret = (c.env?.COOKIE_SECRET || process.env.COOKIE_SECRET) as string;
    const token = await getSignedCookie(c, cookieSecret, "auth_token");

    if (!token) {
        throw new HTTPException(401, { message: "Unauthorized." });
    }

    try {
        const decodedPayload = await verify(
            token as string,
            cookieSecret,
            'HS256',

        );

        c.set("user", decodedPayload as unknown as User);

    } catch (error) {
        const message = error instanceof Error ? error.message : "Unauthorized";
        throw new HTTPException(401, { message });
    }
    await next();
}