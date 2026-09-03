import { UtensilsCrossed } from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  category: string | null;
};

export function PlaceMenu({ visible, items }: { visible: boolean; items: MenuItem[] }) {
  if (!visible || items.length === 0) return null;

  const groups = items.reduce<Array<{ name: string; items: MenuItem[] }>>((current, item) => {
    const name = item.category || "Suggestions du chef";
    const group = current.find((entry) => entry.name === name);
    if (group) group.items.push(item);
    else current.push({ name, items: [item] });
    return current;
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-soft">
      <div className="bg-gradient-to-r from-orange-950 via-orange-800 to-amber-600 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6" />
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange-100">A table</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">La carte</h2>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100 p-6">
        {groups.map((group) => (
          <div key={group.name} className="py-5 first:pt-0 last:pb-0">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-orange-800">{group.name}</h3>
            <div className="mt-4 space-y-4">
              {group.items.map((item) => (
                <article key={item.id} className="flex items-start justify-between gap-5">
                  <div>
                    <h4 className="font-extrabold text-gray-950">{item.name}</h4>
                    {item.description && <p className="mt-1 text-sm leading-6 text-gray-600">{item.description}</p>}
                  </div>
                  {item.price && <span className="shrink-0 font-extrabold text-orange-800">{item.price}</span>}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
