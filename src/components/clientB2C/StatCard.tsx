export default function StatCard({
title,
value,
subValue,
textColor="text-slate-800",
}:{title:string,value:string|number,subValue?:string,textColor?:string}){
return(
<div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
<p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
<h3 className={`text-2xl font-bold ${textColor}`}>{value}</h3>
<p className="text-[11px] text-gray-400 mt-1">{subValue}</p>
</div>
);
}
