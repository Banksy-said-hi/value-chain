"use client";

import React, { useState, useMemo, FC, ChangeEvent, ReactNode } from 'react';

// --- TYPE DEFINITIONS ---

interface InputFieldProps {
    label: string;
    value: number | string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    step?: number;
    min?: number;
    unit?: string;
}

interface SliderFieldProps {
    label: string;
    value: number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
}

interface ResultDisplayProps {
    label: string;
    value: string;
    unit: string;
    colorClass?: string;
}

interface InfoCardProps {
    title: string;
    description: string;
    children: ReactNode;
    titleColor?: string;
}

interface FinalResultCardProps {
    value: string;
    unit: string;
}


// --- HELPER COMPONENTS ---

const InputField: FC<InputFieldProps> = ({ label, value, onChange, type = 'number', step = 1, min = 0, unit }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="flex items-center">
            <input
                type={type}
                step={step}
                min={min}
                value={value}
                onChange={onChange}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {unit && <span className="ml-3 text-gray-400">{unit}</span>}
        </div>
    </div>
);

const SliderField: FC<SliderFieldProps> = ({ label, value, onChange, min, max, step = 1, unit }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <div className="text-center text-white font-semibold mt-2">
            {value} {unit}
        </div>
    </div>
);

const ResultDisplay: FC<ResultDisplayProps> = ({ label, value, unit, colorClass = 'text-white' }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-700">
        <p className="text-gray-300">{label}</p>
        <p className={`text-lg font-bold ${colorClass}`}>
            {value} <span className="text-sm text-gray-400">{unit}</span>
        </p>
    </div>
);

const InfoCard: FC<InfoCardProps> = ({ title, description, children, titleColor = 'text-white' }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
        <h2 className={`text-xl font-bold mb-1 ${titleColor}`}>{title}</h2>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        {children}
    </div>
);

const FinalResultCard: FC<FinalResultCardProps> = ({ value, unit }) => (
     <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 rounded-xl shadow-2xl text-center text-white border border-blue-400">
        <p className="text-lg font-medium opacity-80">Breakeven Cost per Cherry</p>
        <p className="text-5xl font-extrabold tracking-tight mt-2">
            {value}
            <span className="text-3xl font-semibold opacity-90 ml-2">{unit}</span>
        </p>
    </div>
);

// --- MAIN APP COMPONENT ---

const App: FC = () => {
    // --- STATE MANAGEMENT ---
    const [hourlyIncome, setHourlyIncome] = useState<number>(600);
    const [scarcityMultiplier, setScarcityMultiplier] = useState<number>(1.2);
    const [axePrice, setAxePrice] = useState<number>(50);
    const [axeDurability, setAxeDurability] = useState<number>(150);
    const [breadPrice, setBreadPrice] = useState<number>(5);
    const [foodRestoredByBread, setFoodRestoredByBread] = useState<number>(20);
    const [foodDecayRate, setFoodDecayRate] = useState<number>(0.05);
    const [walkingTime, setWalkingTime] = useState<number>(45);
    const [actionTime, setActionTime] = useState<number>(10);
    const [cherriesHarvested, setCherriesHarvested] = useState<number>(3);

    // --- MEMOIZED CALCULATIONS ---
    const baseLaborRate = useMemo(() => hourlyIncome / 3600, [hourlyIncome]);

    const sustenanceRate = useMemo(() => {
        if (foodRestoredByBread === 0) return 0;
        const foodCostPerPoint = breadPrice / foodRestoredByBread;
        const foodCostPerSecond = foodDecayRate * foodCostPerPoint;
        return foodCostPerSecond;
    }, [breadPrice, foodRestoredByBread, foodDecayRate]);

    const toolCostPerUse = useMemo(() => {
        if (axeDurability === 0) return 0;
        return axePrice / axeDurability;
    }, [axePrice, axeDurability]);

    const totalTimeSpent = useMemo(() => walkingTime + actionTime, [walkingTime, actionTime]);

    const costPerAction = useMemo(() => {
        const timeBasedCost = totalTimeSpent * (baseLaborRate + sustenanceRate);
        return (timeBasedCost + toolCostPerUse) * scarcityMultiplier;
    }, [totalTimeSpent, baseLaborRate, sustenanceRate, toolCostPerUse, scarcityMultiplier]);

    const finalPricePerUnit = useMemo(() => {
        if (cherriesHarvested === 0) return 0;
        return costPerAction / cherriesHarvested;
    }, [costPerAction, cherriesHarvested]);


    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8">
            <style>{`
                .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #60a5fa;
                    cursor: pointer;
                    border-radius: 50%;
                }
                .slider-thumb::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #60a5fa;
                    cursor: pointer;
                    border-radius: 50%;
                }
            `}</style>
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Economy Simulator</h1>
                    <p className="text-lg text-blue-300 mt-2">Base Resource Cost Calculator</p>
                </header>

                <div className="text-center bg-gray-800 p-4 rounded-xl mb-10 border border-gray-700 shadow-lg">
                    <p className="text-lg text-gray-300">
                        🌳🪓 Let's figure out the price of a cherry! 🍒 A hungry Seedling walks to a tree, uses their trusty axe, and harvests some delicious cherries. What's the true cost of a single cherry after all that hard work? Let's find out! 👇
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* --- COLUMN 1: CORE ASSUMPTIONS --- */}
                    <div className="space-y-8">
                        <InfoCard title="Core Economic Assumption" description="This value anchors the entire economy. Adjust it to set the baseline value of a Seedling's time spent working." titleColor="text-cyan-300">
                             <SliderField
                                label="Target Hourly Income"
                                value={hourlyIncome}
                                onChange={(e) => setHourlyIncome(Number(e.target.value))}
                                min={100}
                                max={2000}
                                step={10}
                                unit="SeedCoin"
                            />
                        </InfoCard>
                        
                        <InfoCard title="Scarcity" description="This multiplier increases the value of cherries based on their rarity in the world. A higher value means cherries are harder to find.">
                             <InputField
                                label="Scarcity Multiplier"
                                value={scarcityMultiplier}
                                onChange={(e) => setScarcityMultiplier(Number(e.target.value))}
                                step={0.1}
                                min={1}
                                unit="x"
                            />
                        </InfoCard>
                        
                        <InfoCard title="Tier 0 Tool: Axe" description="Define the cost and durability of the basic axe used to harvest cherries from the tree." titleColor="text-orange-300">
                             <InputField
                                label="Price of one Axe"
                                value={axePrice}
                                onChange={(e) => setAxePrice(Number(e.target.value))}
                                unit="SeedCoin"
                            />
                             <SliderField
                                label="Number of uses before Axe breaks"
                                value={axeDurability}
                                onChange={(e) => setAxeDurability(Number(e.target.value))}
                                min={10}
                                max={500}
                                unit="uses"
                            />
                        </InfoCard>
                    </div>

                    {/* --- COLUMN 2: SCENARIO & SUSTENANCE --- */}
                     <div className="space-y-8">
                        <InfoCard title="Harvesting Scenario: Cherries" description="Define the time it takes to walk to a cherry tree and harvest it, and how many cherries you get from one action.">
                             <InputField
                                label="Walking Time to Tree (seconds)"
                                value={walkingTime}
                                onChange={(e) => setWalkingTime(Number(e.target.value))}
                                unit="sec"
                            />
                             <InputField
                                label="Action Time to Harvest (seconds)"
                                value={actionTime}
                                onChange={(e) => setActionTime(Number(e.target.value))}
                                unit="sec"
                            />
                             <SliderField
                                label="Amount of Cherries Harvested"
                                value={cherriesHarvested}
                                onChange={(e) => setCherriesHarvested(Number(e.target.value))}
                                min={1}
                                max={100}
                                unit="units"
                            />
                        </InfoCard>

                        <InfoCard title="Sustenance: Food Need" description="Calculate the 'cost of living' by defining how a basic food item (Bread) affects the Food need, which drains over time." titleColor="text-cyan-300">
                             <InputField
                                label="Price of one loaf of Bread"
                                value={breadPrice}
                                onChange={(e) => setBreadPrice(Number(e.target.value))}
                                unit="SeedCoin"
                            />
                             <InputField
                                label="Food Need restored by Bread"
                                value={foodRestoredByBread}
                                onChange={(e) => setFoodRestoredByBread(Number(e.target.value))}
                                unit="points"
                            />
                             <InputField
                                label="Food Need Decay Rate"
                                value={foodDecayRate}
                                onChange={(e) => setFoodDecayRate(Number(e.target.value))}
                                step={0.001}
                                unit="points/sec"
                            />
                        </InfoCard>
                    </div>

                    {/* --- COLUMN 3: RESULTS --- */}
                    <div className="space-y-8">
                        <FinalResultCard value={finalPricePerUnit.toFixed(4)} unit="SeedCoin" />
                        <InfoCard title="Cost Breakdown" description="These are the underlying costs that contribute to the final price of a single cherry.">
                            <div className="space-y-2">
                               <ResultDisplay label="Base Labor Rate" value={baseLaborRate.toFixed(4)} unit="SeedCoin/sec" colorClass="text-cyan-300" />
                               <ResultDisplay label="Sustenance Rate" value={sustenanceRate.toFixed(4)} unit="SeedCoin/sec" colorClass="text-cyan-300" />
                               <ResultDisplay label="Axe Cost per Use" value={toolCostPerUse.toFixed(4)} unit="SeedCoin" colorClass="text-orange-300" />
                               <ResultDisplay label="Total Cost per Action" value={costPerAction.toFixed(4)} unit="SeedCoin" colorClass="text-yellow-300" />
                            </div>
                        </InfoCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
