// apps/web/features/places/components/place-events.tsx
import { getPlaceEvents } from "../actions";

export async function PlaceEvents({ placeId }: { placeId: string }) {
  const events = await getPlaceEvents(placeId);

  if (events.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Événements à venir
      </h2>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white p-4 rounded-lg border border-gray-100"
          >
            <h3 className="font-medium text-gray-900">{event.title}</h3>
            <p className="text-sm text-gray-600">{event.description}</p>
            <p className="text-sm text-primary-600 mt-2">
              📅 {new Date(event.startDate).toLocaleDateString()}
              {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
