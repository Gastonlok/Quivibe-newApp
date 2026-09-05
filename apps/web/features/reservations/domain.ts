export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];
export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  COMPLETED: "Réalisée",
  NO_SHOW: "Non honorée",
};

export function kinshasaDay(date: Date) {
  return new Date(date.getTime() + 60 * 60_000).toISOString().slice(0, 10);
}

export function toKinshasaDate(date: string, time = "00:00") {
  return new Date(`${date}T${time}:00+01:00`);
}

export function transitionError(
  current: string,
  next: string,
  dateTime: Date,
  now: Date,
  customer = false,
) {
  if (customer) {
    if (next !== "CANCELLED" || !ACTIVE_STATUSES.includes(current))
      return "Cette réservation ne peut plus être annulée.";
    if (dateTime <= now)
      return "Une réservation passée ne peut pas être annulée.";
    return null;
  }
  const allowed: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  };
  if (!allowed[current]?.includes(next))
    return "Cette transition de statut n’est pas autorisée.";
  if (["COMPLETED", "NO_SHOW"].includes(next) && dateTime > now)
    return "Attendez l’heure de la réservation pour renseigner son résultat.";
  return null;
}

export function getScheduleSlots(schedule: {
  reservationStartTime: string;
  reservationEndTime: string;
  reservationInterval: number;
  reservationDuration: number;
}) {
  const minutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const start = minutes(schedule.reservationStartTime),
    end = minutes(schedule.reservationEndTime);
  if (schedule.reservationInterval < 1 || schedule.reservationDuration < 1)
    return [];
  const result: string[] = [];
  for (
    let m = start;
    m + schedule.reservationDuration <= end;
    m += schedule.reservationInterval
  ) {
    result.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  }
  return result;
}
