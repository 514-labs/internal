/**
 * API route for journey metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getJourneyMetrics } from "@/lib/analytics/posthog/queries";
import { TimeWindowSchema } from "@/lib/analytics/posthog/schemas";
import {
  getJourneyById,
  getAllJourneyIds,
  allJourneys,
  getEventLabel,
} from "@/lib/analytics/posthog/journeys";
import {
  ExternalAPIError,
  ValidationError,
} from "@/lib/analytics/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const journeyId = searchParams.get("journeyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Validate time window format
    try {
      TimeWindowSchema.parse({
        startDate,
        endDate,
        comparisonPeriods: [],
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601 format." },
        { status: 400 }
      );
    }

    // If journeyId is provided, fetch specific journey
    if (journeyId) {
      const journey = getJourneyById(journeyId);

      if (!journey) {
        return NextResponse.json(
          { error: `Journey not found: ${journeyId}` },
          { status: 404 }
        );
      }

      const metrics = await getJourneyMetrics(journeyId, journey.events, {
        startDate,
        endDate,
      });

      // Add event labels to steps
      const stepsWithLabels = metrics.steps.map((step) => ({
        ...step,
        eventLabel: getEventLabel(step.eventName),
      }));

      return NextResponse.json({
        journeyId: journey.id,
        journeyName: journey.name,
        product: journey.product,
        description: journey.description,
        timeWindow: { startDate, endDate },
        ...metrics,
        steps: stepsWithLabels,
      });
    }

    // Otherwise, fetch all journeys
    const journeyIds = getAllJourneyIds();
    const allMetrics = await Promise.all(
      journeyIds.map(async (id) => {
        const journey = getJourneyById(id);
        if (!journey) return null;

        try {
          const metrics = await getJourneyMetrics(id, journey.events, {
            startDate,
            endDate,
          });

          return {
            journeyId: journey.id,
            journeyName: journey.name,
            product: journey.product,
            completionRate: metrics.completionRate,
            totalStarted: metrics.totalStarted,
            totalCompleted: metrics.totalCompleted,
          };
        } catch (error) {
          console.error(`Error fetching metrics for journey ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validMetrics = allMetrics.filter((m) => m !== null);

    return NextResponse.json({
      timeWindow: { startDate, endDate },
      journeys: validMetrics,
    });
  } catch (error) {
    console.error("Error fetching journey metrics:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ExternalAPIError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to fetch journey metrics" },
      { status: 500 }
    );
  }
}
