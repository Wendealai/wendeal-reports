"use client";

import { Button } from "@/components/ui/button";

export default function TestDashboard() {
  const handleClick = () => {
    console.log("Button clicked!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Dashboard</h1>
      <Button onClick={handleClick} variant="default">
        Test Button
      </Button>
    </div>
  );
}
