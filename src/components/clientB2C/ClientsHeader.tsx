import {Plus} from "lucide-react";

export default function ClientsHeader({onAdd}:{onAdd:()=>void}){
return(
<div className="flex justify-between items-start mb-8">
<div>
<h1 className="text-2xl font-bold text-slate-800">Clients B2C</h1>
<p className="text-sm text-gray-500">Gérer les comptes de consommateurs individuels</p>
</div>

<button onClick={onAdd}
className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
<Plus size={18}/> Ajouter un client
</button>
</div>
);
}
