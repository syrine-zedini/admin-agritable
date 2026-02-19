import { useState } from "react";

export default function ZoneSelector({ zones, onSelect }: any) {

    const [selectedZone, setSelectedZone] = useState<number | null>(null);

    const handleSelect = (id: number) => {
        setSelectedZone(id);
        onSelect(id);
    };

    return (
        <div className="space-y-2">
            {zones.map((zone: any) => (
                <div
                    key={zone.id}
                    onClick={() => handleSelect(zone.id)}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                        selectedZone === zone.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800">{zone.name}</span>
                        {selectedZone === zone.id && (
                            <span className="bg-green-700 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                                Sélectionné
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{zone.areas}</p>
                </div>
            ))}
        </div>
    );
}
