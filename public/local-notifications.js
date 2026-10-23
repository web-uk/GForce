self.addEventListener("notificationclick", (event) => {
  if (!event.notification.data?.gforceLocal) return;
  event.notification.close();
  const route = ["hoje", "evolucao", "alimentacao"].includes(
    event.notification.data.route,
  )
    ? event.notification.data.route
    : "hoje";
  const target = new URL("/GForce/#/" + route, self.location.origin).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windows) => {
        const existing = windows.find((client) =>
          client.url.startsWith(new URL("/GForce/", self.location.origin).href),
        );
        if (existing) {
          await existing.navigate(target);
          return existing.focus();
        }
        return self.clients.openWindow(target);
      }),
  );
});
