import { z } from "zod";

// Enhanced score validation schema
export const scoreEntrySchema = z.object({
  scores: z.array(z.object({
    scorecardId: z.number().positive("Scorecard ID must be positive"),
    userId: z.number().positive("User ID must be positive"),
    holeId: z.number().positive("Hole ID must be positive"),
    strokes: z.number()
      .min(1, "Minimum score is 1 stroke")
      .max(15, "Maximum score is 15 strokes") // Reasonable upper limit
  })).min(1, "At least one score is required")
});

// Tournament validation with date constraints
export const tournamentValidationSchema = z.object({
  name: z.string()
    .min(3, "Tournament name must be at least 3 characters")
    .max(100, "Tournament name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-']+$/, "Tournament name contains invalid characters"),
  
  courseId: z.number().positive("Course ID must be positive"),
  
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
    .refine((date) => {
      const startDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today;
    }, "Start date cannot be in the past"),
    
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
    
  dailyBuyIn: z.number()
    .min(0, "Daily buy-in cannot be negative")
    .max(1000, "Daily buy-in seems unreasonably high"),
    
  overallBuyIn: z.number()
    .min(0, "Overall buy-in cannot be negative")
    .max(5000, "Overall buy-in seems unreasonably high"),
    
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: "End date must be after or equal to start date",
  path: ["endDate"]
});

// Handicap validation
export const handicapValidationSchema = z.number()
  .min(-5, "Handicap cannot be less than -5")
  .max(54, "Handicap cannot be more than 54")
  .refine((val) => {
    // Check if it's a reasonable decimal (one decimal place)
    return Number.isInteger(val * 10);
  }, "Handicap must have at most one decimal place");