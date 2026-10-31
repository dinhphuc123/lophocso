import { getGameRoom, subscribeRoom, tickRoom, viewRoom } from "@/lib/game-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const room = await getGameRoom(pin);
  if (!room) {
    return new Response("Phòng không tồn tại", { status: 404 });
  }

  const encoder = new TextEncoder();
  let unsub: (() => void) | undefined;
  let timer: NodeJS.Timeout | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream was cancelled
        }
      };

      // Initial push
      send(viewRoom(room));

      // Push on state changes (player join, answer, teacher control)
      unsub = subscribeRoom(pin, (view) => send(view));

      // Heartbeat once every 1s: drives tickRoom for timer expiration
      timer = setInterval(() => {
        void tickRoom(pin);
      }, 1000);
    },
    cancel() {
      unsub?.();
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
