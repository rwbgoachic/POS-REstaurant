import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { fetchTaxRates, calculateTax } from '../lib/tax-service';

export default function TaxCalculator() {
  const [subtotal, setSubtotal] = useState<number>(0);
  const [state, setState] = useState<string>('CA');
  const [taxRate, setTaxRate] = useState<number>(8.25);
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{
    subtotal: number;
    taxAmount: number;
    total: number;
    state: string;
    taxRate: number;
  } | null>(null);

  // Load tax rate for selected state
  useEffect(() => {
    const loadTaxRate = async () => {
      try {
        setIsLoading(true);
        const rate = await fetchTaxRates(state);
        setTaxRate(rate);
      } catch (error) {
        console.error('Error loading tax rate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTaxRate();
  }, [state]);

  const handleCalculate = async () => {
    try {
      setIsLoading(true);
      const taxAmount = await calculateTax(subtotal, state, isExempt);
      const total = subtotal + taxAmount;
      
      setResult({
        subtotal,
        taxAmount,
        total,
        state,
        taxRate
      });
    } catch (error) {
      console.error('Error calculating tax:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--text-color)' }}>Tax Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subtotal">Subtotal Amount ($)</Label>
            <Input
              id="subtotal"
              type="number"
              min="0"
              step="0.01"
              value={subtotal || ''}
              onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
              placeholder="Enter subtotal amount"
            />
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              style={{ 
                borderColor: 'var(--border-color)', 
                backgroundColor: 'var(--surface-color)',
                color: 'var(--text-color)'
              }}
            >
              {Object.keys(fetchTaxRates.state || {}).map((stateCode) => (
                <option key={stateCode} value={stateCode}>{stateCode}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              id="isExempt"
              type="checkbox"
              checked={isExempt}
              onChange={(e) => setIsExempt(e.target.checked)}
              className="h-4 w-4 rounded"
              style={{ 
                accentColor: 'var(--primary-color)',
                borderColor: 'var(--border-color)'
              }}
            />
            <Label htmlFor="isExempt" className="ml-2">Tax Exempt</Label>
          </div>
          
          {result && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--background-color)' }}>
              <h3 className="font-medium mb-2" style={{ color: 'var(--text-color)' }}>Results</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-color-secondary)' }}>Subtotal:</span>
                  <span style={{ color: 'var(--text-color)' }}>${result.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-color-secondary)' }}>
                    Tax ({result.state}, {result.taxRate}%):
                  </span>
                  <span style={{ color: 'var(--text-color)' }}>${result.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span style={{ color: 'var(--text-color)' }}>Total:</span>
                  <span style={{ color: 'var(--primary-color)' }}>${result.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCalculate}
            className="w-full"
            disabled={isLoading}
            style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
          >
            {isLoading ? 'Calculating...' : 'Calculate'}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-4 text-sm" style={{ color: 'var(--text-color-secondary)' }}>
        <p>Tax rates are provided for demonstration purposes only. In a production environment, this would connect to the IRS API for accurate rates.</p>
        <p className="mt-2">API Configuration:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>IRS API Key: {process.env.IRS_API_KEY ? 'Configured' : 'Not configured'}</li>
          <li>State Tax Service: {process.env.STATE_TAX_SERVICE || 'Default URL'}</li>
        </ul>
      </div>
    </div>
  );
}