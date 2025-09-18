import { useState } from "react";
import { Button } from "@/components/ui/button";

const symptomsOptions = [
  "Diarrhea",
  "Vomiting",
  "Fever",
  "Abdominal pain",
  "Skin rashes",
  "Other",
];

export default function CommunityReport() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [location, setLocation] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [affectedCount, setAffectedCount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("");

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          location,
          symptoms,
          affectedCount,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("Submitted successfully");
      setLocation("");
      setSymptoms([]);
      setAffectedCount(0);
      setNotes("");
    } catch (err: any) {
      setStatus(err.message || "Submission failed");
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        Community Reporting
      </h1>
      <p className="text-foreground/70 mb-6">
        Help health officials by submitting observations. Data is stored
        securely.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Location</label>
          <input
            type="text"
            placeholder="Village / Ward / Coordinates"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {symptomsOptions.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => toggleSymptom(opt)}
                className={
                  "px-3 py-1.5 rounded-full border text-sm " +
                  (symptoms.includes(opt)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Number of Affected Individuals
          </label>
          <input
            type="number"
            min={0}
            value={affectedCount}
            onChange={(e) =>
              setAffectedCount(parseInt(e.target.value || "0", 10))
            }
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 min-h-28"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" className="px-6">
            Submit Report
          </Button>
          <span className="text-sm text-foreground/60">{status}</span>
        </div>
      </form>
    </section>
  );
}
