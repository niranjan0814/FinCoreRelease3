<?php

namespace App\Services;

use App\Models\Loan;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * LoanDueDateService
 * 
 * Handles all due date calculations for the microfinance loan system.
 * 
 * Business Rules (Company Standard):
 * - Fixed due days: 1, 8, 15, 22 of each month
 * - Due types: Weekly, Bi-Weekly, Monthly
 * 
 * First Due Date Rule (Skip-Next-Due):
 * When a loan becomes ACTIVE, determine the first due date:
 * - If loan is activated between two due dates, skip the immediate next due and use the following
 * 
 * Activation Windows → First Due:
 * - 1–7   → 15
 * - 8–14  → 22
 * - 15–21 → Next month 1
 * - 22–end of month → Next month 8
 * 
 * Ongoing Collection Rules:
 * - Weekly: collect on every due day (1, 8, 15, 22)
 * - Bi-Weekly: collect every 2 due cycles (skip one due date each time)
 * - Monthly: collect once per month on the same due day
 */
class LoanDueDateService
{
    /**
     * The fixed due days used by the company
     */
    public const DUE_DAYS = [1, 8, 15, 22];

    /**
     * Calculate the first due date and assigned due day when a loan becomes ACTIVE.
     * 
     * @param Carbon $activationDate The date the loan was activated
     * @param string $termType The loan term type: 'Weekly', 'Bi-Weekly', or 'Monthly'
     * @return array ['first_due_date' => Carbon, 'due_day' => int]
     */
    public function calculateFirstDueDate(Carbon $activationDate, string $termType = 'Weekly'): array
    {
        $dayOfMonth = $activationDate->day;
        $year = $activationDate->year;
        $month = $activationDate->month;

        // Determine which window the activation falls into and calculate first due
        if ($dayOfMonth >= 1 && $dayOfMonth <= 7) {
            // Activated 1-7: Skip 8, First due = 15 of same month
            $firstDueDate = Carbon::create($year, $month, 15);
            $dueDay = 15;
        } elseif ($dayOfMonth >= 8 && $dayOfMonth <= 14) {
            // Activated 8-14: Skip 15, First due = 22 of same month
            $firstDueDate = Carbon::create($year, $month, 22);
            $dueDay = 22;
        } elseif ($dayOfMonth >= 15 && $dayOfMonth <= 21) {
            // Activated 15-21: Skip 22, First due = 1 of next month
            $firstDueDate = Carbon::create($year, $month, 1)->addMonth();
            $dueDay = 1;
        } else {
            // Activated 22-end: Skip next month 1, First due = 8 of next month
            $firstDueDate = Carbon::create($year, $month, 8)->addMonth();
            $dueDay = 8;
        }

        Log::info("LoanDueDateService: Calculated first due date", [
            'activation_date' => $activationDate->format('Y-m-d'),
            'activation_day' => $dayOfMonth,
            'term_type' => $termType,
            'first_due_date' => $firstDueDate->format('Y-m-d'),
            'due_day' => $dueDay,
        ]);

        return [
            'first_due_date' => $firstDueDate,
            'due_day' => $dueDay,
        ];
    }

    /**
     * Get the next due date for a loan after a given date.
     * Takes into account the loan's term type (Weekly/Bi-Weekly/Monthly).
     * 
     * @param Loan $loan The loan to calculate for
     * @param Carbon|null $afterDate The date to find the next due after (default: today)
     * @return Carbon|null The next due date, or null if loan has no due configuration
     */
    public function getNextDueDate(Loan $loan, ?Carbon $afterDate = null): ?Carbon
    {
        $afterDate = $afterDate ?? Carbon::today();
        
        // If loan doesn't have new due date fields, fall back to legacy behavior
        if (!$loan->due_day) {
            return $this->getLegacyNextDueDate($loan, $afterDate);
        }

        $dueDay = $loan->due_day;
        $termType = optional($loan->product)->term_type ?? 'Weekly';
        $firstDueDate = $loan->first_due_date ? Carbon::parse($loan->first_due_date) : null;

        // Find upcoming due dates based on term type
        switch ($termType) {
            case 'Monthly':
                return $this->getNextMonthlyDueDate($dueDay, $afterDate);
            
            case 'Bi-Weekly':
                return $this->getNextBiWeeklyDueDate($dueDay, $afterDate, $firstDueDate);
            
            case 'Weekly':
            default:
                return $this->getNextWeeklyDueDate($afterDate);
        }
    }

    /**
     * Get the next due date for Weekly loans.
     * Weekly loans are due on EVERY fixed due day (1, 8, 15, 22).
     * 
     * @param Carbon $afterDate Find due date on or after this date
     * @return Carbon
     */
    private function getNextWeeklyDueDate(Carbon $afterDate): Carbon
    {
        $year = $afterDate->year;
        $month = $afterDate->month;
        $day = $afterDate->day;

        // Find the next due day in current month
        foreach (self::DUE_DAYS as $dueDay) {
            if ($dueDay >= $day) {
                return Carbon::create($year, $month, $dueDay);
            }
        }

        // If no due day left in current month, return first due day of next month
        return Carbon::create($year, $month, 1)->addMonth();
    }

    /**
     * Get the next due date for Bi-Weekly loans.
     * Bi-Weekly means every 2 due cycles (skip one due date each time).
     * 
     * @param int $dueDay The loan's assigned due day
     * @param Carbon $afterDate Find due date on or after this date
     * @param Carbon|null $firstDueDate Reference point for cycle counting
     * @return Carbon
     */
    private function getNextBiWeeklyDueDate(int $dueDay, Carbon $afterDate, ?Carbon $firstDueDate): Carbon
    {
        // If no first due date, calculate from after date
        if (!$firstDueDate) {
            return $this->getNextMonthlyDueDate($dueDay, $afterDate);
        }

        // Count how many due cycles have passed since first due date
        $allDueDates = $this->getDueDatesFromTo($firstDueDate, $afterDate->copy()->addMonths(3));
        
        // Filter to only bi-weekly dates (every other cycle starting from first)
        $biWeeklyDates = [];
        foreach ($allDueDates as $index => $date) {
            if ($index % 2 === 0) { // Every other cycle (0, 2, 4, ...)
                $biWeeklyDates[] = $date;
            }
        }

        // Find first bi-weekly date on or after the afterDate
        foreach ($biWeeklyDates as $date) {
            if ($date->gte($afterDate)) {
                return $date;
            }
        }

        // Fallback: just return next occurrence of due day
        return $this->getNextMonthlyDueDate($dueDay, $afterDate);
    }

    /**
     * Get the next due date for Monthly loans.
     * Monthly loans are due once per month on their assigned due day.
     * 
     * @param int $dueDay The loan's assigned due day
     * @param Carbon $afterDate Find due date on or after this date
     * @return Carbon
     */
    private function getNextMonthlyDueDate(int $dueDay, Carbon $afterDate): Carbon
    {
        $year = $afterDate->year;
        $month = $afterDate->month;
        $day = $afterDate->day;

        if ($dueDay >= $day) {
            // Due day is still in current month
            return Carbon::create($year, $month, $dueDay);
        } else {
            // Due day has passed, go to next month
            return Carbon::create($year, $month, $dueDay)->addMonth();
        }
    }

    /**
     * Check if a loan is due on a specific date.
     * Respects due date extensions.
     * 
     * @param Loan $loan The loan to check
     * @param Carbon $date The date to check
     * @return bool
     */
    /**
     * Check if a loan is due on a specific date.
     * Respects due date extensions and skips.
     * 
     * @param Loan $loan The loan to check
     * @param Carbon $date The date to check
     * @return bool
     */
    public function isDueOnDate(Loan $loan, Carbon $date): bool
    {
        $dateStr = $date->format('Y-m-d');

        // Check for SKIPPED due date
        $isSkipped = $loan->extensions()
            ->whereDate('original_due_date', $dateStr)
            ->where('action_type', 'skip')
            ->exists();

        if ($isSkipped) {
            return false;
        }

        // Check if there's an extension that moved something AWAY from this date (Legacy 'move' logic)
        $movedAway = $loan->extensions()
            ->whereDate('original_due_date', $dateStr)
            ->where('action_type', '!=', 'skip') // Only check moves, not skips
            ->exists();

        // Check if there's an extension that moved something TO this date
        $movedHere = $loan->extensions()
            ->whereDate('new_due_date', $dateStr)
            ->exists();

        // If moved TO this date, it's due
        if ($movedHere) {
            return true;
        }

        // If moved AWAY from this date, it's NOT due
        if ($movedAway) {
            return false;
        }

        // Otherwise, check natural schedule
        return $this->isNaturallyDueOnDate($loan, $date);
    }

    /**
     * Check if a loan is naturally due on a date (ignoring extensions).
     * 
     * @param Loan $loan The loan to check
     * @param Carbon $date The date to check
     * @return bool
     */
    public function isNaturallyDueOnDate(Loan $loan, Carbon $date): bool
    {
        $termType = optional($loan->product)->term_type ?? 'Weekly';
        $dayOfMonth = $date->day;

        // If loan has the new due_day field, use new logic
        if ($loan->due_day) {
            $dueDay = $loan->due_day;
            $firstDueDate = $loan->first_due_date ? Carbon::parse($loan->first_due_date) : null;

            // Date must be on or after first due date
            if ($firstDueDate && $date->lt($firstDueDate)) {
                return false;
            }

            switch ($termType) {
                case 'Monthly':
                    // Monthly: due on assigned due day each month
                    return $dayOfMonth === $dueDay;
                
                case 'Bi-Weekly':
                    // Bi-Weekly: due every other cycle
                    if (!in_array($dayOfMonth, self::DUE_DAYS)) {
                        return false;
                    }
                    // Count cycles from first due date to check if this is a valid bi-weekly date
                    if ($firstDueDate) {
                        $cycleCount = $this->countDueCyclesBetween($loan, $firstDueDate, $date);
                        return $cycleCount % 2 === 0;
                    }
                    return $dayOfMonth === $dueDay;
                
                case 'Weekly':
                default:
                    // Weekly: due on ALL fixed due days
                    return in_array($dayOfMonth, self::DUE_DAYS);
            }
        }

        // Legacy fallback for old loans without due_day
        return $this->isLegacyDueOnDate($loan, $date);
    }

    /**
     * Get all due dates for a loan in a specific month.
     * 
     * @param Loan $loan The loan
     * @param int $year Year
     * @param int $month Month
     * @return array Array of Carbon dates
     */
    public function getDueDatesForMonth(Loan $loan, int $year, int $month): array
    {
        $dueDates = [];
        $termType = optional($loan->product)->term_type ?? 'Weekly';
        $dueDay = $loan->due_day;
        $firstDueDate = $loan->first_due_date ? Carbon::parse($loan->first_due_date) : null;

        // If no new fields, return empty (legacy loans handled separately)
        if (!$dueDay) {
            return $this->getLegacyDueDatesForMonth($loan, $year, $month);
        }

        switch ($termType) {
            case 'Monthly':
                // Only one due date per month
                $date = Carbon::create($year, $month, $dueDay);
                if ($this->isAfterFirstDue($date, $firstDueDate) && !$this->isSkipped($loan, $date)) {
                    $dueDates[] = $date;
                }
                break;
            
            case 'Bi-Weekly':
                // Every other due day
                foreach (self::DUE_DAYS as $day) {
                    $date = Carbon::create($year, $month, $day);
                    if ($this->isAfterFirstDue($date, $firstDueDate) && !$this->isSkipped($loan, $date)) {
                        // Check if this is a valid bi-weekly cycle
                        if ($firstDueDate) {
                            $cycleCount = $this->countDueCyclesBetween($loan, $firstDueDate, $date);
                            if ($cycleCount % 2 === 0) {
                                $dueDates[] = $date;
                            }
                        }
                    }
                }
                break;
            
            case 'Weekly':
            default:
                // All 4 due days
                foreach (self::DUE_DAYS as $day) {
                    $date = Carbon::create($year, $month, $day);
                    if ($this->isAfterFirstDue($date, $firstDueDate) && !$this->isSkipped($loan, $date)) {
                        $dueDates[] = $date;
                    }
                }
                break;
        }

        return $dueDates;
    }

    /**
     * Check if a date is marked as skipped.
     */
    private function isSkipped(Loan $loan, Carbon $date): bool
    {
        return $loan->extensions()
            ->whereDate('original_due_date', $date->format('Y-m-d'))
            ->where('action_type', 'skip')
            ->exists();
    }

    /**
     * Count the number of VALID due cycles between two dates.
     * Skips excluded checks.
     * 
     * @param Loan $loan
     * @param Carbon $start Start date
     * @param Carbon $end End date
     * @return int Number of cycles
     */
    private function countDueCyclesBetween(Loan $loan, Carbon $start, Carbon $end): int
    {
        $rawDueDates = $this->getDueDatesFromTo($start, $end);
        
        // Filter out skipped dates from the cycle count!
        // This effectively "shifts" the cycle count.
        $validCycles = 0;
        
        // Optimize: we just need to know which ones are skipped
        // Ideally we fetch all skips in range once, but for now simple query loop is safer for correctness
        
        foreach ($rawDueDates as $date) {
            // Don't count the check date itself in the cycle count if we are checking parity
            // We need 0-based index for the start date. 
            // Actually, if start=Jan1, end=Jan15. Dates: Jan1, Jan8, Jan15.
            // If Jan8 is skipped. Valid dates: Jan1, Jan15.
            // Jan1 is index 0 (Even). Jan15 is index 1 (Odd).
            // So Jan15 becomes NOT due for Bi-Weekly.
            
            // Wait, calculateNaturalCycles logic:
            // The logic requires counting how many valid intervals passed.
            
            if ($date->gt($end)) break; // Should not happen with getDueDatesFromTo logic
            if ($date->lt($start)) continue; // Should not happen
            
            // If this date is skipped, do NOT increment cycle count
            if (!$this->isSkipped($loan, $date)) {
                $validCycles++;
            }
        }
        
        // We want the index of 'end' date in the valid sequence.
        // If Jan1 (Valid), Jan8 (Skipped), Jan15 (Valid).
        // Calling countDueCyclesBetween(Jan1, Jan15).
        // Loop: Jan1 (Valid), Jan8 (Skip), Jan15 (Valid).
        // validCycles = 2.
        // Return 2 - 1 = 1.
        // So Jan15 has index 1 -> Odd -> Not due.
        // Correct?
        // Let's trace Bi-Weekly: Due on 0, 2, 4...
        // Jan1 (Index 0) -> Due.
        // Jan8 (Skip).
        // Jan15 (Index 1) -> Odd -> Not Due.
        // Jan22 (Valid). Index 2 -> Even -> Due.
        
        // This perfectly matches "Shift By One" logic!
        // Before skip: Jan1 (0), Jan8(1), Jan15(2). Due: Jan1, Jan15.
        // After skip Jan8: Jan1(0), Jan15(1), Jan22(2). Due: Jan1, Jan22.
        // Jan15 was Due (2), became Not Due (1). SHIFTED!
        
        return max(0, $validCycles - 1);
    }

    /**
     * Generate all due dates from start to end date.
     * 
     * @param Carbon $start Start date (inclusive)
     * @param Carbon $end End date (inclusive)
     * @return array Array of Carbon dates
     */
    private function getDueDatesFromTo(Carbon $start, Carbon $end): array
    {
        $dates = [];
        $current = $start->copy()->startOfMonth();
        $endMonth = $end->copy()->endOfMonth();

        while ($current->lte($endMonth)) {
            foreach (self::DUE_DAYS as $day) {
                $date = Carbon::create($current->year, $current->month, $day);
                if ($date->gte($start) && $date->lte($end)) {
                    $dates[] = $date;
                }
            }
            $current->addMonth();
        }

        return $dates;
    }

    /**
     * Check if a date is on or after the first due date.
     * 
     * @param Carbon $date Date to check
     * @param Carbon|null $firstDueDate First due date reference
     * @return bool
     */
    private function isAfterFirstDue(Carbon $date, ?Carbon $firstDueDate): bool
    {
        if (!$firstDueDate) {
            return true;
        }
        return $date->gte($firstDueDate);
    }

    // =====================================================
    // LEGACY FALLBACK METHODS
    // For backward compatibility with existing loans
    // =====================================================

    /**
     * Legacy: Get next due date using agreement_date based calculation.
     * This preserves existing behavior for loans without new due date fields.
     * 
     * @param Loan $loan The loan
     * @param Carbon $afterDate Find due after this date
     * @return Carbon
     */
    private function getLegacyNextDueDate(Loan $loan, Carbon $afterDate): Carbon
    {
        $termType = optional($loan->product)->term_type ?? 'Weekly';
        $agreementDate = $loan->agreement_date 
            ? Carbon::parse($loan->agreement_date) 
            : Carbon::parse($loan->created_at);

        switch ($termType) {
            case 'Monthly':
                $nextDue = $afterDate->copy();
                if ($afterDate->day > $agreementDate->day) {
                    $nextDue->addMonth();
                }
                $nextDue->day = min($agreementDate->day, $nextDue->daysInMonth);
                return $nextDue;

            case 'Bi-Weekly':
                $daysSinceAgreement = $agreementDate->diffInDays($afterDate);
                $cycles = ceil($daysSinceAgreement / 14);
                return $agreementDate->copy()->addDays($cycles * 14);

            case 'Weekly':
            default:
                $dayOfWeek = $agreementDate->dayOfWeek;
                $nextDue = $afterDate->copy();
                if ($afterDate->dayOfWeek !== $dayOfWeek) {
                    $nextDue->next($dayOfWeek);
                }
                return $nextDue;
        }
    }

    /**
     * Legacy: Check if loan is due on date using old logic.
     * 
     * @param Loan $loan The loan
     * @param Carbon $date The date to check
     * @return bool
     */
    private function isLegacyDueOnDate(Loan $loan, Carbon $date): bool
    {
        $termType = optional($loan->product)->term_type ?? 'Weekly';
        $agreementDate = $loan->agreement_date 
            ? Carbon::parse($loan->agreement_date) 
            : Carbon::parse($loan->created_at);

        if ($date->lt($agreementDate)) {
            return false;
        }

        switch ($termType) {
            case 'Monthly':
                return $agreementDate->day === $date->day;
            
            case 'Bi-Weekly':
                $daysDiff = $agreementDate->diffInDays($date);
                return $daysDiff % 14 === 0;
            
            case 'Weekly':
            default:
                return $agreementDate->dayOfWeek === $date->dayOfWeek;
        }
    }

    /**
     * Legacy: Get due dates for month using old logic.
     * 
     * @param Loan $loan The loan
     * @param int $year Year
     * @param int $month Month
     * @return array
     */
    private function getLegacyDueDatesForMonth(Loan $loan, int $year, int $month): array
    {
        $dueDates = [];
        $termType = optional($loan->product)->term_type ?? 'Weekly';
        $agreementDate = $loan->agreement_date 
            ? Carbon::parse($loan->agreement_date) 
            : Carbon::parse($loan->created_at);

        $startOfMonth = Carbon::create($year, $month, 1);
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        switch ($termType) {
            case 'Monthly':
                $date = Carbon::create($year, $month, min($agreementDate->day, $endOfMonth->day));
                if ($date->gte($agreementDate)) {
                    $dueDates[] = $date;
                }
                break;

            case 'Bi-Weekly':
            case 'Weekly':
            default:
                $current = $startOfMonth->copy();
                while ($current->lte($endOfMonth)) {
                    if ($this->isLegacyDueOnDate($loan, $current)) {
                        $dueDates[] = $current->copy();
                    }
                    $current->addDay();
                }
                break;
        }

        return $dueDates;
    }
}
