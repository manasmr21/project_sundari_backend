import { Hono } from 'hono'
import routes from './routes'
import { HTTPException } from 'hono/http-exception'

export type Bindings = CloudflareBindings;

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route("/api/v1", routes);

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ success: false, message: error.message }, error.status);
  }
  return c.json({ success: false, message: error.message || 'Internal Server Error' }, (error as any).status || 500)
})

export default app