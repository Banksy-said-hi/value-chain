'use client';
import React, { useState, useMemo, FC, ChangeEvent, ReactNode } from 'react';

// --- TYPE DEFINITIONS ---

interface Material {
    id: string;
    name: string;
    price: number;
    category: 'raw' | 'processed' | 'product';
}

interface Ingredient {
    materialId: string;
    quantity: number;
}

interface Recipe {
    name: string;
    ingredients: Ingredient[];
    actionTime: number;
    machineName: string;
    skillName: string;
}

interface ValueChainStage {
    id: string;
    outputMaterialId: string;
    recipe: Recipe;
    dependsOn: string[]; // List of material IDs needed from the hub
}

interface ValueChain {
    name: string;
    finalProductId: string;
    stages: ValueChainStage[];
}

// --- DATA ---

const recipes: Record<string, Recipe> = {
    'wooden_planks': {
        name: 'Wooden Planks',
        ingredients: [{ materialId: 'raw_lumber', quantity: 1 }],
        actionTime: 5,
        machineName: 'Plank Saw',
        skillName: 'Wood Processing',
    },
    'shoddy_chair': {
        name: 'Shoddy Chair',
        ingredients: [
            { materialId: 'wooden_planks', quantity: 5 },
            { materialId: 'raw_lumber', quantity: 2 }
        ],
        actionTime: 25,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'wooden_outhouse': {
        name: 'Wooden Outhouse',
        ingredients: [{ materialId: 'wooden_planks', quantity: 20 }],
        actionTime: 120,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'wash_basin': {
        name: 'Wash Basin',
        ingredients: [{ materialId: 'wooden_planks', quantity: 8 }],
        actionTime: 40,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'wooden_rooftops': {
        name: 'Wooden Rooftops',
        ingredients: [{ materialId: 'wooden_planks', quantity: 15 }],
        actionTime: 60,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'shoddy_bed': {
        name: 'Shoddy Bed',
        ingredients: [{ materialId: 'wooden_planks', quantity: 12 }, { materialId: 'raw_lumber', quantity: 4 }],
        actionTime: 80,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'chair_simple': {
        name: 'Chair (Simple)',
        ingredients: [{ materialId: 'wooden_planks', quantity: 6 }],
        actionTime: 30,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'chair_armchair': {
        name: 'Chair (Armchair)',
        ingredients: [{ materialId: 'wooden_planks', quantity: 10 }],
        actionTime: 50,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
     'shelf_small': {
        name: 'Shelf (Small)',
        ingredients: [{ materialId: 'wooden_planks', quantity: 4 }],
        actionTime: 20,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'shelf_big': {
        name: 'Shelf (Big)',
        ingredients: [{ materialId: 'wooden_planks', quantity: 8 }],
        actionTime: 40,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'table': {
        name: 'Table',
        ingredients: [{ materialId: 'wooden_planks', quantity: 10 }],
        actionTime: 50,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'couch': {
        name: 'Couch',
        ingredients: [{ materialId: 'wooden_planks', quantity: 15 }, { materialId: 'raw_lumber', quantity: 5 }],
        actionTime: 100,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'bed': {
        name: 'Bed',
        ingredients: [{ materialId: 'wooden_planks', quantity: 18 }],
        actionTime: 90,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    },
    'night_stand': {
        name: 'Night Stand',
        ingredients: [{ materialId: 'wooden_planks', quantity: 4 }],
        actionTime: 20,
        machineName: 'Simple Carpentry Station',
        skillName: 'Wood Assembly',
    }
};

const valueChains: Record<string, ValueChain> = {
    'shoddy_chair_chain': {
        name: 'Shoddy Chair Production',
        finalProductId: 'shoddy_chair',
        stages: [
            { id: 'plank_stage', outputMaterialId: 'wooden_planks', recipe: recipes['wooden_planks'], dependsOn: ['raw_lumber'] },
            { id: 'chair_stage', outputMaterialId: 'shoddy_chair', recipe: recipes['shoddy_chair'], dependsOn: ['raw_lumber', 'wooden_planks'] },
        ]
    },
    ...Object.keys(recipes).filter(id => id !== 'wooden_planks' && id !== 'shoddy_chair').reduce((acc, id) => {
        acc[`${id}_chain`] = {
            name: `${recipes[id].name} Production`,
            finalProductId: id,
            stages: [
                { id: 'plank_stage', outputMaterialId: 'wooden_planks', recipe: recipes['wooden_planks'], dependsOn: ['raw_lumber'] },
                { id: `${id}_stage`, outputMaterialId: id, recipe: recipes[id], dependsOn: recipes[id].ingredients.map(i => i.materialId) },
            ]
        };
        return acc;
    }, {} as Record<string, ValueChain>)
};


// --- HELPER COMPONENTS ---

const InputField: FC<{ label: string; value: number; onChange: (e: ChangeEvent<HTMLInputElement>) => void; unit: string; step?: number; }> = ({ label, value, onChange, unit, step = 1 }) => (
    <div className="mb-2">
        <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
        <div className="flex items-center">
            <input type="number" step={step} value={value} onChange={onChange} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <span className="ml-2 text-gray-400">{unit}</span>
        </div>
    </div>
);

const InfoCard: FC<{title: string; description: string; children: ReactNode; titleColor?: string;}> = ({ title, description, children, titleColor = 'text-white' }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 h-fit">
        <h2 className={`text-xl font-bold mb-1 ${titleColor}`}>{title}</h2>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        {children}
    </div>
);

const FormulaDisplay: FC<{ values: Record<string, any>, isNumeric?: boolean }> = ({ values, isNumeric = false }) => {
    const format = (val: any) => isNumeric ? (typeof val === 'number' ? val.toFixed(3) : val) : val;
    
    const color = {
        input: 'text-green-300',
        action: 'text-cyan-300',
        machine: 'text-orange-300',
        skill: 'text-purple-300',
        complexity: 'text-purple-300',
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-lg text-center text-lg sm:text-xl font-mono tracking-tighter">
            <span className="text-white">Price = ((</span>
            <span className={color.input}>{format(values.totalInputMaterialCost)}</span>
            <span className="text-white"> + (</span>
            <span className={color.action}>{format(values.actionTime)}</span>
            <span className="text-white"> × (</span>
            <span className={color.action}>{format(values.baseLaborRate)}</span>
            <span className="text-white"> + </span>
            <span className={color.action}>{format(values.sustenanceRate)}</span>
            <span className="text-white">) + </span>
            <span className={color.machine}>{format(values.machineCostPerUse)}</span>
            <span className="text-white">)) × </span>
            <span className={color.skill}>{format(values.skillMultiplier)}</span>
            <span className="text-white">) × </span>
            <span className={color.complexity}>{format(values.complexityMultiplier)}</span>
        </div>
    );
};


// --- STAGE COMPONENT ---

const StageCard: FC<{
    stage: ValueChainStage;
    materials: Material[];
    globalRates: { baseLaborRate: number; sustenanceRate: number; };
    onPriceCalculated: (materialId: string, price: number) => void;
}> = ({ stage, materials, globalRates, onPriceCalculated }) => {
    
    const [actionTime, setActionTime] = useState(stage.recipe.actionTime);
    const [machinePrice, setMachinePrice] = useState(200);
    const [machineDurability, setMachineDurability] = useState(1000);
    const [skillMultiplier, setSkillMultiplier] = useState(1.1);
    const [complexityMultiplier, setComplexityMultiplier] = useState(1.2);

    const prerequisitesMet = useMemo(() => {
        return stage.dependsOn.every(depId => materials.some(m => m.id === depId && m.price > 0));
    }, [stage.dependsOn, materials]);

    const totalInputMaterialCost = useMemo(() => {
        if (!prerequisitesMet) return 0;
        return stage.recipe.ingredients.reduce((total, ing) => {
            const material = materials.find(m => m.id === ing.materialId);
            return total + ((material?.price || 0) * ing.quantity);
        }, 0);
    }, [stage.recipe.ingredients, materials, prerequisitesMet]);

    const machineCostPerUse = useMemo(() => machineDurability > 0 ? machinePrice / machineDurability : 0, [machinePrice, machineDurability]);

    const actionCost = useMemo(() => {
        const laborAndSustenance = actionTime * (globalRates.baseLaborRate + globalRates.sustenanceRate);
        return laborAndSustenance + machineCostPerUse;
    }, [actionTime, globalRates, machineCostPerUse]);

    const finalPrice = useMemo(() => {
        if (!prerequisitesMet) return 0;
        return ((totalInputMaterialCost + actionCost) * skillMultiplier) * complexityMultiplier;
    }, [totalInputMaterialCost, actionCost, skillMultiplier, complexityMultiplier, prerequisitesMet]);

    const outputMaterial = materials.find(m => m.id === stage.outputMaterialId);

    return (
        <div className={`bg-gray-800 rounded-xl border-t-4 ${prerequisitesMet ? 'border-blue-500' : 'border-gray-600'} shadow-lg transition-all`}>
            <div className="p-6">
                <h3 className="text-xl font-bold text-white">{stage.recipe.name}</h3>
                <p className="text-sm text-gray-400 mb-4">Stage Output: <span className="font-semibold">{outputMaterial?.name || stage.recipe.name}</span></p>

                <div className={`transition-opacity duration-500 ${!prerequisitesMet ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div>
                            <h4 className="font-semibold text-green-300 mb-2">🌿 Ingredients</h4>
                            {stage.recipe.ingredients.map(ing => {
                                const material = materials.find(m => m.id === ing.materialId);
                                const isMet = material && material.price > 0;
                                return (<div key={ing.materialId} className={`flex justify-between p-2 text-sm rounded mb-2 ${isMet ? 'bg-gray-700' : 'bg-red-900/50'}`}>
                                    <span>{ing.quantity} x {material?.name}</span>
                                    <span className="font-mono">@ {(material?.price || 0).toFixed(4)}</span>
                                 </div>)
                            })}
                        </div>
                        <div>
                            <h4 className="font-semibold text-purple-300 mb-2">✨ Value Multipliers</h4>
                            <InputField label="Skill Multiplier" value={skillMultiplier} onChange={e => setSkillMultiplier(Number(e.target.value))} unit="x" step={0.1}/>
                            <InputField label="Complexity Multiplier" value={complexityMultiplier} onChange={e => setComplexityMultiplier(Number(e.target.value))} unit="x" step={0.1}/>
                        </div>
                        <div>
                           <h4 className="font-semibold text-orange-300 mb-2">⚙️ Machine: {stage.recipe.machineName}</h4>
                           <InputField label="Machine Price" value={machinePrice} onChange={e => setMachinePrice(Number(e.target.value))} unit="SC"/>
                           <InputField label="Machine Durability" value={machineDurability} onChange={e => setMachineDurability(Number(e.target.value))} unit="uses"/>
                        </div>
                        <div>
                            <h4 className="font-semibold text-cyan-300 mb-2">⏱️ Action Costs</h4>
                            <InputField label="Action Time" value={actionTime} onChange={e => setActionTime(Number(e.target.value))} unit="s"/>
                            <p className="text-sm mt-2">Skill: <span className="font-bold text-fuchsia-400">{stage.recipe.skillName}</span></p>
                        </div>
                    </div>
                    {prerequisitesMet && (
                        <div className="mt-4 pt-4 border-t border-gray-700">
                            <h4 className="font-semibold text-white mb-2 text-center">Stage Calculation</h4>
                            <div className="bg-gray-900/50 p-2 rounded-lg text-center text-sm font-mono">
                                <span className="text-white">(</span>
                                <span className="text-green-300" title="Input Cost">{totalInputMaterialCost.toFixed(2)}</span>
                                <span className="text-white"> + </span>
                                <span className="text-cyan-300" title="Action Cost">{actionCost.toFixed(2)}</span>
                                <span className="text-white">) × </span>
                                <span className="text-purple-300" title="Skill Multiplier">{skillMultiplier.toFixed(2)}</span>
                                <span className="text-white"> × </span>
                                <span className="text-purple-300" title="Complexity Multiplier">{complexityMultiplier.toFixed(2)}</span>
                            </div>
                             <p className="text-xs text-gray-500 text-center mt-1">(Input Cost + Action Cost) × Skill Mult. × Complexity Mult.</p>
                        </div>
                    )}
                </div>
            </div>
            {prerequisitesMet ? (
                <div className="bg-gray-900/50 p-4 rounded-b-xl flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-300">Calculated Price:</p>
                        <p className="text-2xl font-bold text-cyan-300">{finalPrice.toFixed(4)} <span className="text-lg">SeedCoin</span></p>
                    </div>
                    <button onClick={() => onPriceCalculated(stage.outputMaterialId, finalPrice)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">
                        Set Price in Hub
                    </button>
                </div>
            ) : (
                 <div className="bg-red-900/50 p-4 rounded-b-xl text-center">
                    <p className="font-semibold text-red-200">Prerequisites not met. Set ingredient prices in the Shared Materials Hub.</p>
                </div>
            )}
        </div>
    );
}


// --- MAIN APP COMPONENT ---

const App: FC = () => {
    // --- STATE MANAGEMENT ---
    const initialMaterials: Material[] = [
        { id: 'raw_lumber', name: 'Raw Lumber', price: 0.8750, category: 'raw' },
        { id: 'wooden_planks', name: 'Wooden Planks', price: 0, category: 'processed' },
        ...Object.keys(recipes).filter(id => id !== 'wooden_planks').map(id => ({ id, name: recipes[id].name, price: 0, category: 'product' }))
    ];
    const uniqueInitialMaterials = initialMaterials.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);


    const [sharedMaterials, setSharedMaterials] = useState<Material[]>(uniqueInitialMaterials);
    const [selectedChainId, setSelectedChainId] = useState<string>('shoddy_chair_chain');
    const [hourlyIncome, setHourlyIncome] = useState<number>(600);
    const [sustenanceRate, setSustenanceRate] = useState<number>(0.15);

    const activeChain = valueChains[selectedChainId];
    const baseLaborRate = useMemo(() => hourlyIncome / 3600, [hourlyIncome]);

    const handlePriceUpdate = (materialId: string, newPrice: number) => {
        setSharedMaterials(currentMaterials => 
            currentMaterials.map(m => m.id === materialId ? { ...m, price: newPrice } : m)
        );
    };

    const finalProductPrice = sharedMaterials.find(m => m.id === activeChain.finalProductId)?.price || 0;

    const categoryColorMap = {
        raw: { bg: 'bg-green-800/50', text: 'text-green-300' },
        processed: { bg: 'bg-yellow-800/50', text: 'text-yellow-300' },
        product: { bg: 'bg-blue-800/50', text: 'text-blue-300' },
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Seedling Value Chain Simulator</h1>
                    <p className="text-lg text-blue-300 mt-2">Top-Down Production Analysis</p>
                </header>

                <div className="space-y-8">
                    {/* --- CONTROLS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InfoCard title="🎯 1. Select Final Product" description="Choose an item to analyze its full production chain from top to bottom.">
                            <select value={selectedChainId} onChange={(e) => setSelectedChainId(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md">
                                {Object.keys(valueChains).map(id => <option key={id} value={id}>{valueChains[id].name}</option>)}
                            </select>
                        </InfoCard>
                         <InfoCard title="🌍 2. Set Global Rates" description="These core rates anchor your entire economy's value of time and effort.">
                            <div className="flex gap-4">
                               <InputField label="Hourly Income" value={hourlyIncome} onChange={(e) => setHourlyIncome(Number(e.target.value))} unit="SC" />
                               <InputField label="Sustenance Rate" value={sustenanceRate} onChange={(e) => setSustenanceRate(Number(e.target.value))} unit="SC/s" step={0.01}/>
                            </div>
                        </InfoCard>
                    </div>

                    {/* --- SHARED MATERIALS HUB --- */}
                    <InfoCard title="📦 3. Shared Materials Hub" description="Set the price for base materials here. Stages below will unlock once their ingredients have a price.">
                        <div className="flex justify-start items-center gap-4 mb-4 text-xs">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Raw Material</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Processed</span></div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Final Product</span></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sharedMaterials.map(material => {
                                const colors = categoryColorMap[material.category] || categoryColorMap.product;
                                return (
                                <div key={material.id} className={`p-3 rounded-lg ${colors.bg}`}>
                                    <label className={`text-sm font-semibold ${colors.text}`}>{material.name}</label>
                                    <input type="number" value={material.price} onChange={(e) => handlePriceUpdate(material.id, Number(e.target.value))} step="0.01" className="w-full bg-gray-700 p-1 rounded-md text-cyan-300 font-mono mt-1"/>
                                </div>
                            )})}
                        </div>
                    </InfoCard>
                    
                    {/* --- VALUE CHAIN STAGES --- */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-center text-white mt-6">🏭 Production Stages for: {activeChain.name}</h2>
                        {activeChain.stages.map((stage, index) => (
                           <div key={stage.id} className="relative pl-8">
                                <div className="absolute top-0 left-3.5 w-px h-full bg-gray-600"></div>
                                <div className="absolute top-5 left-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white ring-8 ring-gray-900">{index + 1}</div>
                                <StageCard 
                                    stage={stage} 
                                    materials={sharedMaterials} 
                                    globalRates={{ baseLaborRate, sustenanceRate }}
                                    onPriceCalculated={handlePriceUpdate}
                                />
                           </div>
                        ))}
                    </div>

                    {/* --- FINAL FORMULA DISPLAY --- */}
                    <InfoCard title="💰 Final Price Calculation" description={`The final calculated price for one unit of the selected item, ${activeChain.name}.`}>
                        <div className="text-center my-4">
                            <p className="text-lg font-bold text-white">{activeChain.name} Price:</p>
                            <p className="text-5xl font-extrabold text-cyan-300 py-2">{finalProductPrice.toFixed(4)}</p>
                            <p className="text-lg font-bold text-white">SeedCoin</p>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2 text-center">The Core Formula</h3>
                                <FormulaDisplay values={{
                                    totalInputMaterialCost: 'Σ(Inputs)',
                                    actionTime: 'Time',
                                    baseLaborRate: 'Labor',
                                    sustenanceRate: 'Sust.',
                                    machineCostPerUse: 'Machine',
                                    skillMultiplier: 'Skill',
                                    complexityMultiplier: 'Complex',
                                }} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2 text-center">Formula with Live Numbers (for last stage)</h3>
                                <p className="text-xs text-center text-gray-400 mb-2">Note: This feature requires more complex state management to show live numbers for the specific stage being edited.</p>
                            </div>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    );
}

export default App;
