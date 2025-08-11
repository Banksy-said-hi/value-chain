import React, { FC, ChangeEvent, ReactNode, useState } from 'react';

// --- HELPER COMPONENTS ---

export const InputField: FC<{ 
    label: string; 
    value: number; 
    onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
    unit: string; 
    step?: number; 
}> = ({ label, value, onChange, unit, step = 1 }) => (
    <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="flex items-center">
            <input 
                type="number" 
                step={step} 
                value={value} 
                onChange={onChange} 
                className="w-full bg-gray-700 border border-gray-600 text-white font-mono rounded-md p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
            />
            <span className="ml-3 text-gray-400 font-sans">{unit}</span>
        </div>
    </div>
);

export const InfoCard: FC<{
    title: string; 
    description: string; 
    children: ReactNode;
}> = ({ title, description, children }) => (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        {children}
    </div>
);

export const CollapsibleBoard: FC<{
    title: string;
    description: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: ReactNode;
    dataAttr?: string;
}> = ({ title, description, isExpanded, onToggle, children, dataAttr }) => (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700" {...(dataAttr && { [dataAttr]: true })}>
        <button
            onClick={onToggle}
            className="w-full p-6 text-left hover:bg-gray-750 rounded-xl transition-colors"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-sm text-gray-400">{description}</p>
                </div>
                <div className="text-2xl text-gray-400 font-sans">
                    {isExpanded ? '▼' : '▶'}
                </div>
            </div>
        </button>
        {isExpanded && (
            <div className="px-6 pb-6">
                {children}
            </div>
        )}
    </div>
);
