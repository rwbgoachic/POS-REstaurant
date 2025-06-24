import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function SharedUITest() {
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-color)' }}>Shared UI Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Card Component</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a card from the shared UI library</p>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="test-input">Test Input</Label>
              <Input id="test-input" placeholder="Enter some text" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>Submit</Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Button Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
    </div>
  );
}