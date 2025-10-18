"use client";
import { useState, useEffect } from "react";
import type { Recipe, InputDefinition } from "@/lib/types";

interface DynamicInputFormProps {
  recipe: Recipe;
  onInputChange: (params: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

export function DynamicInputForm({ recipe, onInputChange, initialValues = {} }: DynamicInputFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);

  // Parse inputs - support both old string[] format and new InputDefinition[] format
  const inputDefinitions: InputDefinition[] = Array.isArray(recipe.inputs) 
    ? recipe.inputs.map(input => {
        if (typeof input === 'string') {
          // Legacy format - convert string to InputDefinition
          const [name, defaultValue] = input.includes('=') ? input.split('=') : [input, undefined];
          return {
            name: name.trim(),
            prompt: `Enter ${name.trim().replace('_', ' ')}:`,
            type: name === 'loops' ? 'integer' : 'text',
            required: !defaultValue,
            default: defaultValue ? (name === 'loops' ? parseInt(defaultValue) : defaultValue) : undefined,
            multiline: name === 'problem' || name === 'topic'
          } as InputDefinition;
        }
        return input as InputDefinition;
      })
    : [];

  // Initialize values with defaults
  useEffect(() => {
    const defaultValues: Record<string, any> = {};
    inputDefinitions.forEach(input => {
      if (input.default !== undefined && !(input.name in values)) {
        defaultValues[input.name] = input.default;
      }
    });
    if (Object.keys(defaultValues).length > 0) {
      setValues(prev => ({ ...defaultValues, ...prev }));
    }
  }, [recipe.id]);

  // Notify parent of changes
  useEffect(() => {
    onInputChange(values);
  }, [values, onInputChange]);

  const updateValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const renderInput = (input: InputDefinition) => {
    const value = values[input.name] ?? input.default ?? '';

    switch (input.type) {
      case 'integer':
        return (
          <input
            type="number"
            value={value}
            onChange={e => updateValue(input.name, parseInt(e.target.value) || 0)}
            min={input.range?.[0]}
            max={input.range?.[1]}
            required={input.required}
            className="form-input"
          />
        );

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => updateValue(input.name, e.target.checked)}
            className="form-checkbox"
          />
        );

      case 'array':
        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : value}
            onChange={e => updateValue(input.name, e.target.value.split('\n').filter(l => l.trim()))}
            placeholder="Enter one item per line"
            rows={3}
            required={input.required}
            className="form-textarea"
          />
        );

      case 'text':
      default:
        if (input.multiline) {
          return (
            <textarea
              value={value}
              onChange={e => updateValue(input.name, e.target.value)}
              placeholder={input.examples?.[0] || input.prompt}
              rows={4}
              required={input.required}
              className="form-textarea"
            />
          );
        }
        return (
          <input
            type="text"
            value={value}
            onChange={e => updateValue(input.name, e.target.value)}
            placeholder={input.examples?.[0] || input.prompt}
            required={input.required}
            className="form-input"
          />
        );
    }
  };

  if (inputDefinitions.length === 0) {
    // Fallback for recipes without input definitions
    return (
      <div className="dynamic-form">
        <div className="form-group">
          <label>Problem Description</label>
          <textarea
            value={values.problem || ''}
            onChange={e => updateValue('problem', e.target.value)}
            placeholder="Describe your problem…"
            rows={4}
            className="form-textarea"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dynamic-form">
      {inputDefinitions.map(input => (
        <div key={input.name} className="form-group">
          <label>
            {input.prompt}
            {input.required && <span className="required">*</span>}
          </label>
          {renderInput(input)}
          {input.examples && input.examples.length > 1 && (
            <div className="form-examples">
              <small>Examples: {input.examples.slice(0, 3).join(', ')}</small>
            </div>
          )}
          {input.range && (
            <div className="form-hint">
              <small>Range: {input.range[0]} - {input.range[1]}</small>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}