'use client' 

import React, { useState, useMemo, FC, ChangeEvent, ReactNode, useEffect } from 'react';
import { 
    Material, 
    Recipe, 
    parsedRecipes, 
    allMaterials, 
    categoryColorMap 
} from './data/recipeData';
import { InputField, InfoCard, CollapsibleBoard } from './components/HelperComponents';

// --- ADDITIONAL TYPES ---
interface Machine {
    id: string;
    name: string;
    worth: number;
    totalUses: number;
    costPerUse: number;
}

// --- STORAGE KEYS ---
const STORAGE_KEYS = {
    BOARD_MATERIALS: 'valuechain_board_materials',
    BOARD_MACHINES: 'valuechain_board_machines',
    HOURLY_INCOME: 'valuechain_hourly_income',
    SUSTENANCE_RATE: 'valuechain_sustenance_rate',
    MACHINE_WORTH: 'valuechain_machine_worth',
    MACHINE_USAGE_COUNT: 'valuechain_machine_usage_count',
    SELECTED_RECIPE_ID: 'valuechain_selected_recipe_id',
    CALCULATED_PRODUCTS: 'valuechain_calculated_products',
    BOARD_EXPANSIONS: 'valuechain_board_expansions'
};

// --- STORAGE UTILITIES ---
const saveToStorage = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
};

const loadFromStorage = function<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }
    return defaultValue;
};

// --- MAIN APP COMPONENT ---
const App: FC = () => {
    // --- STATE MANAGEMENT ---
    const [boardMaterials, setBoardMaterials] = useState<Material[]>(() => {
        const stored = loadFromStorage(STORAGE_KEYS.BOARD_MATERIALS, null);
        if (stored) return stored;
        
        // If no stored data, ensure all base materials start at 0
        return allMaterials.map(m => ({
            ...m,
            price: m.category === 'product' ? 0 : 0 // All materials start at 0
        }));
    });
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>(() => 
        loadFromStorage(STORAGE_KEYS.SELECTED_RECIPE_ID, parsedRecipes[0]?.id || '')
    );
    const [hourlyIncome, setHourlyIncome] = useState<number>(() => 
        loadFromStorage(STORAGE_KEYS.HOURLY_INCOME, 100)
    );
    const [sustenanceRate, setSustenanceRate] = useState<number>(() => 
        loadFromStorage(STORAGE_KEYS.SUSTENANCE_RATE, 0.001)
    );
    const [machineWorth, setMachineWorth] = useState<number>(() => 
        loadFromStorage(STORAGE_KEYS.MACHINE_WORTH, 1000)
    );
    const [machineUsageCount, setMachineUsageCount] = useState<number>(() => 
        loadFromStorage(STORAGE_KEYS.MACHINE_USAGE_COUNT, 100)
    );
    
    // Board expansion states
    const [boardExpansions, setBoardExpansions] = useState(() => 
        loadFromStorage(STORAGE_KEYS.BOARD_EXPANSIONS, {
            inputs: false,
            products: false,
            machines: false
        })
    );
    const [isInputsBoardExpanded, setIsInputsBoardExpanded] = useState<boolean>(boardExpansions.inputs);
    const [isProductsBoardExpanded, setIsProductsBoardExpanded] = useState<boolean>(boardExpansions.products);
    const [isMachinesBoardExpanded, setIsMachinesBoardExpanded] = useState<boolean>(boardExpansions.machines);
    
    // Track which products have been calculated
    const [calculatedProducts, setCalculatedProducts] = useState<Set<string>>(() => 
        new Set(loadFromStorage(STORAGE_KEYS.CALCULATED_PRODUCTS, []))
    );
    
    // Initialize machines from recipes with default values
    const [boardMachines, setBoardMachines] = useState<Machine[]>(() => {
        const stored = loadFromStorage(STORAGE_KEYS.BOARD_MACHINES, null);
        if (stored) return stored;
        
        const uniqueMachines = new Map<string, string>();
        parsedRecipes.forEach(recipe => {
            if (recipe.machineName && recipe.machineName !== 'N/A') {
                uniqueMachines.set(recipe.machineName.toLowerCase().replace(/\s+/g, '_'), recipe.machineName);
            }
        });
        
        return Array.from(uniqueMachines.entries()).map(([id, name]) => ({
            id,
            name,
            worth: 1000,
            totalUses: 100,
            costPerUse: 10
        }));
    });
    
    const activeRecipe = parsedRecipes.find(r => r.id === selectedRecipeId);

    // --- SAVE TO LOCALSTORAGE ON CHANGES ---
    useEffect(() => {
        saveToStorage(STORAGE_KEYS.BOARD_MATERIALS, boardMaterials);
    }, [boardMaterials]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.BOARD_MACHINES, boardMachines);
    }, [boardMachines]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.HOURLY_INCOME, hourlyIncome);
    }, [hourlyIncome]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SUSTENANCE_RATE, sustenanceRate);
    }, [sustenanceRate]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.MACHINE_WORTH, machineWorth);
    }, [machineWorth]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.MACHINE_USAGE_COUNT, machineUsageCount);
    }, [machineUsageCount]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.SELECTED_RECIPE_ID, selectedRecipeId);
    }, [selectedRecipeId]);

    useEffect(() => {
        saveToStorage(STORAGE_KEYS.CALCULATED_PRODUCTS, Array.from(calculatedProducts));
    }, [calculatedProducts]);

    useEffect(() => {
        const expansions = {
            inputs: isInputsBoardExpanded,
            products: isProductsBoardExpanded,
            machines: isMachinesBoardExpanded
        };
        saveToStorage(STORAGE_KEYS.BOARD_EXPANSIONS, expansions);
    }, [isInputsBoardExpanded, isProductsBoardExpanded, isMachinesBoardExpanded]);

    // --- MEMOIZED CALCULATIONS ---
    const baseLaborRate = useMemo(() => hourlyIncome / 3600, [hourlyIncome]);
    
    const totalInputMaterialCost = useMemo(() => {
        if (!activeRecipe) return 0;
        return activeRecipe.ingredients.reduce((total, ing) => {
            const material = boardMaterials.find(m => m.id === ing.materialId);
            return total + ((material?.price || 0) * ing.quantity);
        }, 0);
    }, [activeRecipe, boardMaterials]);

    const actionTime = activeRecipe ? activeRecipe.autoTime : 0;
    
    // Get machine cost from board machines or fall back to individual machine settings
    const currentMachine = activeRecipe ? boardMachines.find(m => 
        m.name === activeRecipe.machineName || m.id === activeRecipe.machineName.toLowerCase().replace(/\s+/g, '_')
    ) : null;
    
    const machineCostPerUse = currentMachine ? currentMachine.costPerUse : 
        (machineUsageCount > 0 ? machineWorth / machineUsageCount : 0);
    
    const skillMultiplier = 1.1; // Placeholder

    const finalPricePerBatch = useMemo(() => {
        const actionCost = (actionTime * (baseLaborRate + sustenanceRate)) + machineCostPerUse;
        const totalCost = (totalInputMaterialCost + actionCost) * skillMultiplier;
        return totalCost;
    }, [totalInputMaterialCost, actionTime, baseLaborRate, sustenanceRate, machineCostPerUse, skillMultiplier]);

    const finalPricePerUnit = useMemo(() => {
        if (!activeRecipe || activeRecipe.amount === 0) return 0;
        const price = finalPricePerBatch / activeRecipe.amount;
        
        // Update the board materials with the calculated price
        setBoardMaterials(currentMaterials => 
            currentMaterials.map(m => 
                m.id === activeRecipe.id && m.category === 'product' 
                    ? { ...m, price } 
                    : m
            )
        );
        
        // Track that this product has been calculated
        setCalculatedProducts(prev => new Set([...prev, activeRecipe.id]));
        
        return price;
    }, [finalPricePerBatch, activeRecipe]);

    const handlePriceUpdateOnBoard = (materialId: string, newPrice: number) => {
        setBoardMaterials(currentMaterials => 
            currentMaterials.map(m => m.id === materialId ? { ...m, price: newPrice } : m)
        );
    };

    const handleMachineUpdateOnBoard = (machineId: string, field: 'worth' | 'totalUses', newValue: number) => {
        setBoardMachines(currentMachines => 
            currentMachines.map(m => {
                if (m.id === machineId) {
                    const updatedMachine = { ...m, [field]: newValue };
                    // Recalculate cost per use
                    updatedMachine.costPerUse = updatedMachine.totalUses > 0 ? updatedMachine.worth / updatedMachine.totalUses : 0;
                    return updatedMachine;
                }
                return m;
            })
        );
    };

    const handleExport = () => {
        const csvData = [];
        
        // Header row
        csvData.push([
            'Product Name',
            'Price (SC)'
        ]);
        
        // Add only final products with their prices
        finalProducts.forEach(product => {
            csvData.push([
                product.name,
                product.price.toFixed(4)
            ]);
        });
        
        // Convert to CSV string
        const csvString = csvData.map(row => 
            row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        // Download CSV
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'final_products_prices.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Clear all stored data and reset to defaults
    const handleReset = () => {
        if (confirm('Are you sure you want to reset all data? This will clear all your inputs and calculations.')) {
            // Clear localStorage
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Reset state to defaults
            window.location.reload();
        }
    };

    // Handle submitting/calculating the selected product
    const handleSubmitCalculation = () => {
        if (!activeRecipe) return;
        
        // Calculate the price (this triggers the useMemo calculations)
        const price = finalPricePerUnit;
        
        // Update the board materials with the calculated price
        setBoardMaterials(currentMaterials => 
            currentMaterials.map(m => 
                m.id === activeRecipe.id && m.category === 'product' 
                    ? { ...m, price } 
                    : m
            )
        );
        
        // Track that this product has been calculated
        setCalculatedProducts(prev => new Set([...prev, activeRecipe.id]));
        
        // Automatically expand the products board to show the result
        setIsProductsBoardExpanded(true);
        
        // Scroll to the products board after a short delay
        setTimeout(() => {
            const productsBoard = document.querySelector('[data-products-board]');
            productsBoard?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    // Color coding for materials based on specification status and requirements
    const getMaterialColors = (material: Material, isRequired: boolean = false) => {
        if (material.category === 'product') {
            if (calculatedProducts.has(material.id)) {
                return { bg: 'bg-blue-800/50', text: 'text-blue-300', border: 'border-blue-600' };
            } else {
                return { bg: 'bg-gray-700/50', text: 'text-gray-400', border: 'border-gray-600' };
            }
        } else {
            // For raw and processed materials
            if (isRequired) {
                // Required materials get special highlighting
                if (material.price === 0) {
                    return { bg: 'bg-orange-800/70', text: 'text-orange-200', border: 'border-orange-400 border-2' };
                } else {
                    return { bg: 'bg-yellow-800/70', text: 'text-yellow-200', border: 'border-yellow-400 border-2' };
                }
            } else {
                // Non-required materials get standard colors
                if (material.price === 0) {
                    return { bg: 'bg-red-800/50', text: 'text-red-300', border: 'border-red-600' };
                } else {
                    return { bg: 'bg-green-800/50', text: 'text-green-300', border: 'border-green-600' };
                }
            }
        }
    };

    const inputMaterials = useMemo(() => boardMaterials.filter(m => m.category === 'raw' || m.category === 'processed'), [boardMaterials]);
    const finalProducts = useMemo(() => boardMaterials.filter(m => m.category === 'product'), [boardMaterials]);

    // Get required materials for the active recipe
    const requiredMaterials = useMemo(() => {
        if (!activeRecipe) return new Set<string>();
        
        const required = new Set<string>();
        
        // Add direct ingredients
        activeRecipe.ingredients.forEach(ing => {
            required.add(ing.materialId);
        });
        
        // Recursively add ingredients from sub-recipes
        const addRecursiveIngredients = (materialId: string) => {
            const subRecipe = parsedRecipes.find(r => r.id === materialId);
            if (subRecipe) {
                subRecipe.ingredients.forEach(ing => {
                    required.add(ing.materialId);
                    addRecursiveIngredients(ing.materialId);
                });
            }
        };
        
        activeRecipe.ingredients.forEach(ing => {
            addRecursiveIngredients(ing.materialId);
        });
        
        return required;
    }, [activeRecipe]);


    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Seedling Value Chain Simulator</h1>
                    <p className="text-lg text-blue-300">Production Cost Analysis Tool</p>
                </header>

                <div className="space-y-6">
                    {/* --- CONTROLS --- */}
                    <InfoCard title="🌍 1. Set Global Rates" description="These core rates anchor your entire economy's value of time and effort.">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                               <InputField label="Target Hourly Income" value={hourlyIncome} onChange={(e) => setHourlyIncome(Number(e.target.value))} unit="SC" />
                               <p className="text-xs text-green-400 mt-1 font-sans">Specified</p>
                           </div>
                           <div>
                               <InputField label="Sustenance Rate" value={sustenanceRate} onChange={(e) => setSustenanceRate(Number(e.target.value))} unit="SC/s" step={0.001}/>
                               <p className="text-xs text-green-400 mt-1 font-sans">Specified</p>
                           </div>
                        </div>
                    </InfoCard>

                    <CollapsibleBoard 
                        title="📦 2. Base Resources" 
                        description="Set the prices for raw and processed materials. These are the foundational costs for all recipes. Materials required for the selected product are highlighted with orange borders."
                        isExpanded={isInputsBoardExpanded}
                        onToggle={() => setIsInputsBoardExpanded(!isInputsBoardExpanded)}
                    >
                        {activeRecipe && (
                            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                                <p className="text-sm font-sans text-gray-300 mb-3">
                                    <span className="font-bold">Selected Product:</span> {activeRecipe.name}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                                    <div>
                                        <p className="font-semibold text-orange-300 mb-2">Required Materials:</p>
                                        <div className="space-y-1">
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 bg-orange-600 border-2 border-orange-400 rounded mr-2"></div>
                                                Needed, price not set
                                            </span>
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 bg-yellow-600 border-2 border-yellow-400 rounded mr-2"></div>
                                                Needed, price set
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-300 mb-2">Other Materials:</p>
                                        <div className="space-y-1">
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 bg-red-600 border border-red-500 rounded mr-2"></div>
                                                Not needed, no price
                                            </span>
                                            <span className="flex items-center">
                                                <div className="w-3 h-3 bg-green-600 border border-green-500 rounded mr-2"></div>
                                                Not needed, has price
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {!activeRecipe && (
                            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                                <p className="text-sm font-sans text-gray-300 text-center">
                                    Select a product above to see which materials are required and get color-coded highlighting.
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {inputMaterials.map(material => {
                                const isRequired = requiredMaterials.has(material.id);
                                const colors = getMaterialColors(material, isRequired);
                                return (
                                <div key={material.id} className={`p-4 rounded-lg ${colors.bg} border ${colors.border} ${isRequired ? 'shadow-lg' : ''}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className={`text-sm font-medium ${colors.text} font-sans`}>{material.name}</label>
                                        {isRequired && (
                                            <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-full font-sans">NEEDED</span>
                                        )}
                                    </div>
                                    <input 
                                        type="number" 
                                        value={material.price} 
                                        onChange={(e) => handlePriceUpdateOnBoard(material.id, Number(e.target.value))} 
                                        step="0.01" 
                                        className={`w-full bg-gray-700 p-2 rounded-md text-cyan-300 font-mono mt-2 ${isRequired ? 'ring-2 ring-orange-400' : ''}`}
                                    />
                                    {material.price === 0 && (
                                        <p className={`text-xs mt-2 font-sans ${isRequired ? 'text-orange-300' : 'text-red-400'}`}>
                                            {isRequired ? 'Required - Not specified' : 'Not specified'}
                                        </p>
                                    )}
                                    {material.price > 0 && (
                                        <p className={`text-xs mt-2 font-sans ${isRequired ? 'text-yellow-300' : 'text-green-400'}`}>
                                            {isRequired ? 'Required - Specified' : 'Specified'}
                                        </p>
                                    )}
                                </div>
                            )})}
                        </div>
                    </CollapsibleBoard>

                    <InfoCard title="🎯 3. Select Final Product" description="Choose an item to analyze its production recipe and final cost.">
                        <div className="space-y-4">
                            <select 
                                value={selectedRecipeId} 
                                onChange={(e) => setSelectedRecipeId(e.target.value)} 
                                className="w-full bg-gray-700 text-white font-sans p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                {parsedRecipes.length > 0 ? (
                                    parsedRecipes.map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                                    ))
                                ) : (
                                    <option disabled>No recipes loaded</option>
                                )}
                            </select>
                        </div>
                    </InfoCard>
                    
                    {activeRecipe ? (
                        <div data-calculation-results>
                            <h2 className="text-2xl font-bold text-center text-white mt-6 mb-6 font-sans">🏭 Production Details for: {activeRecipe.name}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InfoCard title="INPUTS" description="Materials required for this recipe.">
                                    {activeRecipe.ingredients.length > 0 ? activeRecipe.ingredients.map(ing => {
                                        const material = boardMaterials.find(m => m.id === ing.materialId);
                                        return (<div key={ing.materialId} className="flex justify-between p-3 text-sm rounded mb-2 bg-gray-700">
                                            <span className="font-sans">{ing.quantity} x {material?.name || ing.materialId}</span>
                                            <span className="font-mono">@ {(material?.price || 0).toFixed(4)}</span>
                                         </div>)
                                    }) : <p className="text-gray-400 text-center font-sans">No inputs required.</p>}
                                </InfoCard>
                                <InfoCard title="MACHINE" description={`Crafted at: ${activeRecipe.machineName}`}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <InputField 
                                                label="Machine Worth" 
                                                value={currentMachine ? currentMachine.worth : machineWorth} 
                                                onChange={(e) => {
                                                    const newValue = Number(e.target.value);
                                                    if (currentMachine) {
                                                        handleMachineUpdateOnBoard(currentMachine.id, 'worth', newValue);
                                                    } else {
                                                        setMachineWorth(newValue);
                                                    }
                                                }} 
                                                unit="SC" 
                                                step={0.01}
                                            />
                                            <InputField 
                                                label="Total Uses" 
                                                value={currentMachine ? currentMachine.totalUses : machineUsageCount} 
                                                onChange={(e) => {
                                                    const newValue = Number(e.target.value);
                                                    if (currentMachine) {
                                                        handleMachineUpdateOnBoard(currentMachine.id, 'totalUses', newValue);
                                                    } else {
                                                        setMachineUsageCount(newValue);
                                                    }
                                                }} 
                                                unit="uses" 
                                                step={1}
                                            />
                                        </div>
                                        
                                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                                            <p className="text-gray-400 text-sm font-sans">Cost per Use</p>
                                            <p className="text-xl font-bold text-cyan-300 font-mono">{machineCostPerUse.toFixed(4)} SC</p>
                                            <p className="text-xs text-gray-500 mt-2 font-mono">
                                                ({currentMachine ? currentMachine.worth : machineWorth} ÷ {currentMachine ? currentMachine.totalUses : machineUsageCount})
                                            </p>
                                        </div>
                                        
                                        <div className="text-center space-y-3">
                                            <div>
                                                <p className="text-gray-400 text-sm font-sans">Manual Time</p>
                                                <p className="text-xl font-bold text-white font-mono">{activeRecipe.manualTime} sec</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm font-sans">Auto Time</p>
                                                <p className="text-xl font-bold text-white font-mono">{activeRecipe.autoTime} sec</p>
                                            </div>
                                        </div>
                                    </div>
                                </InfoCard>
                                <InfoCard title="SKILL" description={`Skill required: ${activeRecipe.skillName}`}>
                                   <p className="text-center text-gray-400 font-sans">Availability:</p>
                                   <p className="text-center text-white font-medium font-sans">{activeRecipe.storedOn !== 'N/A' ? `Default on ${activeRecipe.storedOn}` : `Learned by Seedling`}</p>
                                </InfoCard>
                            </div>

                            <InfoCard title="💰 Final Price Calculation" description={`The final calculated price for one unit of the selected item, ${activeRecipe.name}.`}>
                                <div className="text-center my-4">
                                    <div className="grid grid-cols-2 gap-6 items-center">
                                        <div>
                                            <p className="text-lg font-bold text-white font-sans">Total Batch Cost</p>
                                            <p className="text-3xl font-bold text-yellow-300 py-3 font-mono">{finalPricePerBatch.toFixed(4)}</p>
                                            <p className="text-sm text-gray-400 font-sans">(For {activeRecipe.amount} units)</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-white font-sans">{activeRecipe.name} Price (per unit):</p>
                                            <p className="text-5xl font-bold text-cyan-300 py-3 font-mono">{finalPricePerUnit.toFixed(4)}</p>
                                            <p className="text-xs text-gray-500 mt-2 font-mono">(Total Batch Cost / {activeRecipe.amount})</p>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>

                            <InfoCard title="🧮 Calculation Formula" description="Detailed breakdown of how the final price is calculated step by step.">
                                <div className="space-y-4 text-sm">
                                    {/* Input Materials Cost */}
                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-cyan-300 font-bold mb-3 font-sans">1. Input Materials Cost:</h4>
                                        {activeRecipe.ingredients.length > 0 ? (
                                            <div className="space-y-2">
                                                {activeRecipe.ingredients.map(ing => {
                                                    const material = boardMaterials.find(m => m.id === ing.materialId);
                                                    const cost = (material?.price || 0) * ing.quantity;
                                                    return (
                                                        <div key={ing.materialId} className="space-y-1">
                                                            <div className="flex justify-between text-gray-300">
                                                                <span className="font-sans">{material?.name || ing.materialId}:</span>
                                                                <span className="font-mono">{ing.quantity} units × {(material?.price || 0).toFixed(4)} SC = {cost.toFixed(4)} SC</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="border-t border-gray-600 pt-3 mt-3 flex justify-between font-bold text-yellow-300">
                                                    <span className="font-sans">Materials Cost Total:</span>
                                                    <span className="font-mono">{totalInputMaterialCost.toFixed(4)} SC</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 font-sans">No input materials required → 0.0000 SC</p>
                                        )}
                                    </div>

                                    {/* Action Cost Breakdown */}
                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-cyan-300 font-bold mb-3 font-sans">2. Action Cost Breakdown:</h4>
                                        <div className="space-y-2 text-gray-300">
                                            <div className="bg-gray-600 p-3 rounded">
                                                <h5 className="text-yellow-300 font-semibold mb-2 font-sans">2a. Labor Cost:</h5>
                                                <div className="space-y-1 ml-3">
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Hourly Income:</span>
                                                        <span className="font-mono">{hourlyIncome.toFixed(2)} SC/hour</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Labor Rate per Second:</span>
                                                        <span className="font-mono">{hourlyIncome.toFixed(2)} ÷ 3600 = {baseLaborRate.toFixed(6)} SC/sec</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Action Time:</span>
                                                        <span className="font-mono">{actionTime} seconds</span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold text-yellow-300">
                                                        <span className="font-sans">Labor Cost:</span>
                                                        <span className="font-mono">{baseLaborRate.toFixed(6)} × {actionTime} = {(baseLaborRate * actionTime).toFixed(4)} SC</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-gray-600 p-3 rounded">
                                                <h5 className="text-yellow-300 font-semibold mb-2 font-sans">2b. Sustenance Cost:</h5>
                                                <div className="space-y-1 ml-3">
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Sustenance Rate:</span>
                                                        <span className="font-mono">{sustenanceRate.toFixed(6)} SC/sec</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Action Time:</span>
                                                        <span className="font-mono">{actionTime} seconds</span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold text-yellow-300">
                                                        <span className="font-sans">Sustenance Cost:</span>
                                                        <span className="font-mono">{sustenanceRate.toFixed(6)} × {actionTime} = {(sustenanceRate * actionTime).toFixed(4)} SC</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-gray-600 p-3 rounded">
                                                <h5 className="text-yellow-300 font-semibold mb-2 font-sans">2c. Machine Cost:</h5>
                                                <div className="space-y-1 ml-3">
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Machine Worth:</span>
                                                        <span className="font-mono">{(currentMachine ? currentMachine.worth : machineWorth).toFixed(2)} SC</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="font-sans">Total Uses:</span>
                                                        <span className="font-mono">{currentMachine ? currentMachine.totalUses : machineUsageCount} uses</span>
                                                    </div>
                                                    <div className="flex justify-between font-semibold text-yellow-300">
                                                        <span className="font-sans">Machine Cost per Use:</span>
                                                        <span className="font-mono">{(currentMachine ? currentMachine.worth : machineWorth).toFixed(2)} ÷ {currentMachine ? currentMachine.totalUses : machineUsageCount} = {machineCostPerUse.toFixed(4)} SC</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="border-t border-gray-600 pt-3 mt-3">
                                                <div className="bg-gray-800 p-3 rounded">
                                                    <h5 className="text-orange-300 font-bold mb-2 font-sans">Total Action Cost:</h5>
                                                    <div className="space-y-1">
                                                        <div className="text-gray-300 font-mono text-xs">
                                                            ({baseLaborRate.toFixed(6)} + {sustenanceRate.toFixed(6)}) × {actionTime} + {machineCostPerUse.toFixed(4)}
                                                        </div>
                                                        <div className="text-gray-300 font-mono text-xs">
                                                            = {(baseLaborRate + sustenanceRate).toFixed(6)} × {actionTime} + {machineCostPerUse.toFixed(4)}
                                                        </div>
                                                        <div className="text-gray-300 font-mono text-xs">
                                                            = {(actionTime * (baseLaborRate + sustenanceRate)).toFixed(4)} + {machineCostPerUse.toFixed(4)}
                                                        </div>
                                                        <div className="text-orange-300 font-bold font-mono">
                                                            = {(actionTime * (baseLaborRate + sustenanceRate) + machineCostPerUse).toFixed(4)} SC
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Multipliers */}
                                    <div className="bg-gray-700 p-4 rounded-lg">
                                        <h4 className="text-cyan-300 font-bold mb-3 font-sans">3. Skill Multiplier:</h4>
                                        <div className="space-y-2 text-gray-300">
                                            <div className="flex justify-between">
                                                <span className="font-sans">Skill Bonus:</span>
                                                <span className="font-mono">×{skillMultiplier.toFixed(1)} (10% bonus)</span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-sans mt-1">Applied to the sum of materials and action costs</p>
                                        </div>
                                    </div>

                                    {/* Final Calculation */}
                                    <div className="bg-gradient-to-r from-blue-800 to-purple-800 p-4 rounded-lg border-2 border-cyan-300">
                                        <h4 className="text-white font-bold mb-4 text-center font-sans">📐 Final Calculation:</h4>
                                        <div className="space-y-4">
                                            {/* Step by step calculation */}
                                            <div className="bg-black/30 p-4 rounded">
                                                <div className="text-center space-y-2">
                                                    <div className="text-gray-200 text-sm font-sans">
                                                        <span className="block">Total Batch Cost = (Materials Cost + Action Cost) × Skill Multiplier</span>
                                                    </div>
                                                    
                                                    <div className="text-yellow-300 font-mono text-sm space-y-1">
                                                        <div>= ({totalInputMaterialCost.toFixed(4)} + {(actionTime * (baseLaborRate + sustenanceRate) + machineCostPerUse).toFixed(4)}) × {skillMultiplier}</div>
                                                        <div>= {(totalInputMaterialCost + actionTime * (baseLaborRate + sustenanceRate) + machineCostPerUse).toFixed(4)} × {skillMultiplier}</div>
                                                        <div className="text-cyan-300 font-bold text-lg">= {finalPricePerBatch.toFixed(4)} SC</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Per unit calculation */}
                                            <div className="bg-black/30 p-4 rounded">
                                                <div className="text-center space-y-2">
                                                    <div className="text-gray-200 text-sm font-sans">
                                                        Price Per Unit = Total Batch Cost ÷ Amount Produced
                                                    </div>
                                                    <div className="text-yellow-300 font-mono text-sm space-y-1">
                                                        <div>= {finalPricePerBatch.toFixed(4)} ÷ {activeRecipe.amount}</div>
                                                        <div className="text-cyan-300 font-bold text-xl">= {finalPricePerUnit.toFixed(4)} SC per unit</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Summary */}
                                            <div className="bg-gradient-to-r from-green-800 to-blue-800 p-3 rounded border border-cyan-400">
                                                <div className="text-center">
                                                    <div className="text-white font-bold font-sans">Final Answer:</div>
                                                    <div className="text-2xl font-bold text-cyan-300 font-mono">{finalPricePerUnit.toFixed(4)} SC</div>
                                                    <div className="text-sm text-gray-300 font-sans">per unit of {activeRecipe.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </InfoCard>
                            
                            <div className="text-center mt-6">
                                <button
                                    onClick={handleSubmitCalculation}
                                    disabled={!activeRecipe}
                                    className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors font-sans"
                                >
                                    {activeRecipe ? `Calculate ${activeRecipe.name}` : 'Select a Product'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 bg-gray-800 p-8 rounded-xl font-sans">
                            <p>No product selected. Please load recipe data to begin.</p>
                        </div>
                    )}
                    
                    <CollapsibleBoard 
                        title="📋 PRODUCTS BOARD" 
                        description="Central ledger of all final product prices, updated automatically from calculations."
                        isExpanded={isProductsBoardExpanded}
                        onToggle={() => setIsProductsBoardExpanded(!isProductsBoardExpanded)}
                        dataAttr="data-products-board"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {finalProducts.map(material => {
                                const colors = getMaterialColors(material, false);
                                return (
                                <div key={material.id} className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                                    <label className={`text-sm font-medium ${colors.text} font-sans`}>{material.name}</label>
                                    <input 
                                        type="number" 
                                        readOnly 
                                        value={material.price.toFixed(4)} 
                                        className="w-full bg-gray-700 p-2 rounded-md text-cyan-300 font-mono mt-2 cursor-not-allowed"
                                    />
                                    {!calculatedProducts.has(material.id) && (
                                        <p className="text-xs text-gray-500 mt-2 font-sans">Not calculated</p>
                                    )}
                                    {calculatedProducts.has(material.id) && (
                                        <p className="text-xs text-blue-400 mt-2 font-sans">Calculated</p>
                                    )}
                                </div>
                            )})}
                        </div>
                    </CollapsibleBoard>

                    <CollapsibleBoard 
                        title="🏭 MACHINES BOARD" 
                        description="Central ledger of all machine costs and usage parameters. Changes here affect all recipes using these machines."
                        isExpanded={isMachinesBoardExpanded}
                        onToggle={() => setIsMachinesBoardExpanded(!isMachinesBoardExpanded)}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boardMachines.map(machine => (
                                <div key={machine.id} className="p-4 rounded-lg bg-purple-800/50 border border-purple-600">
                                    <label className="text-sm font-medium text-purple-300 block mb-3 font-sans">{machine.name}</label>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-400 font-sans">Worth (SC)</label>
                                            <input 
                                                type="number" 
                                                value={machine.worth} 
                                                onChange={(e) => handleMachineUpdateOnBoard(machine.id, 'worth', Number(e.target.value))} 
                                                step={0.01}
                                                className="w-full bg-gray-700 p-2 rounded-md text-cyan-300 font-mono text-sm mt-1"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs text-gray-400 font-sans">Total Uses</label>
                                            <input 
                                                type="number" 
                                                value={machine.totalUses} 
                                                onChange={(e) => handleMachineUpdateOnBoard(machine.id, 'totalUses', Number(e.target.value))} 
                                                step={1}
                                                className="w-full bg-gray-700 p-2 rounded-md text-cyan-300 font-mono text-sm mt-1"
                                            />
                                        </div>
                                        
                                        <div className="bg-gray-700 p-3 rounded text-center">
                                            <p className="text-xs text-gray-400 font-sans">Cost per Use</p>
                                            <p className="text-lg font-bold text-cyan-300 font-mono">{machine.costPerUse.toFixed(4)}</p>
                                            <p className="text-xs text-green-400 mt-2 font-sans">Specified</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleBoard>

                    <InfoCard title="📊 Export & Reset" description="Generate a CSV spreadsheet of final products and their calculated prices, or reset all data. Your data is automatically saved and will persist across page reloads.">
                        <div className="space-y-3">
                            <button onClick={handleExport} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg text-lg font-sans transition-colors">
                                Generate Spreadsheet
                            </button>
                            <button onClick={handleReset} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg text-sm font-sans transition-colors">
                                Reset All Data
                            </button>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    );
}

export default App;
