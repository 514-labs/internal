"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyFlowDiagram } from "./journey-flow-diagram";
import { Badge } from "@/components/ui/badge";

interface JourneyMetricsCardProps {
  startDate: string;
  endDate: string;
}

export function JourneyMetricsCard({
  startDate,
  endDate,
}: JourneyMetricsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["journey-metrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(
        `/api/analytics/posthog/metrics/journeys?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch journey metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch individual journey details
  const [selectedJourney, setSelectedJourney] = React.useState<string | null>(
    null
  );

  const { data: journeyDetail } = useQuery({
    queryKey: ["journey-detail", selectedJourney, startDate, endDate],
    queryFn: async () => {
      if (!selectedJourney) return null;
      const params = new URLSearchParams({
        journeyId: selectedJourney,
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/metrics/journeys?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch journey detail");
      }
      return response.json();
    },
    enabled: !!selectedJourney,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    // Set first journey as selected by default
    if (data?.journeys && data.journeys.length > 0 && !selectedJourney) {
      setSelectedJourney(data.journeys[0].journeyId);
    }
  }, [data, selectedJourney]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Journeys</CardTitle>
          <CardDescription>Loading journey metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Journeys</CardTitle>
          <CardDescription className="text-red-500">
            Error loading journey metrics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const journeys = data?.journeys || [];
  const borealJourneys = journeys.filter((j: any) => j.product === "boreal");
  const moosestackJourneys = journeys.filter(
    (j: any) => j.product === "moosestack"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Journeys</CardTitle>
        <CardDescription>
          Visual representation of key user journeys and conversion funnels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="boreal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="boreal">
              Boreal Journeys ({borealJourneys.length})
            </TabsTrigger>
            <TabsTrigger value="moosestack">
              Moosestack Journeys ({moosestackJourneys.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="boreal" className="space-y-4">
            {borealJourneys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No Boreal journey data available
              </div>
            ) : (
              <div className="space-y-4">
                {/* Journey selector */}
                <div className="flex flex-wrap gap-2">
                  {borealJourneys.map((journey: any) => (
                    <Badge
                      key={journey.journeyId}
                      variant={
                        selectedJourney === journey.journeyId
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedJourney(journey.journeyId)}
                    >
                      {journey.journeyName}
                      <span className="ml-2 text-xs">
                        {journey.completionRate.toFixed(0)}%
                      </span>
                    </Badge>
                  ))}
                </div>

                {/* Journey detail */}
                {journeyDetail &&
                  selectedJourney &&
                  borealJourneys.some(
                    (j: any) => j.journeyId === selectedJourney
                  ) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {journeyDetail.journeyName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {journeyDetail.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {journeyDetail.completionRate?.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {journeyDetail.totalCompleted} /{" "}
                            {journeyDetail.totalStarted} completed
                          </div>
                        </div>
                      </div>

                      <JourneyFlowDiagram
                        steps={journeyDetail.steps || []}
                        totalStarted={journeyDetail.totalStarted || 0}
                        className="border rounded-lg"
                      />
                    </div>
                  )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="moosestack" className="space-y-4">
            {moosestackJourneys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No Moosestack journey data available
              </div>
            ) : (
              <div className="space-y-4">
                {/* Journey selector */}
                <div className="flex flex-wrap gap-2">
                  {moosestackJourneys.map((journey: any) => (
                    <Badge
                      key={journey.journeyId}
                      variant={
                        selectedJourney === journey.journeyId
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedJourney(journey.journeyId)}
                    >
                      {journey.journeyName}
                      <span className="ml-2 text-xs">
                        {journey.completionRate.toFixed(0)}%
                      </span>
                    </Badge>
                  ))}
                </div>

                {/* Journey detail */}
                {journeyDetail &&
                  selectedJourney &&
                  moosestackJourneys.some(
                    (j: any) => j.journeyId === selectedJourney
                  ) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {journeyDetail.journeyName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {journeyDetail.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {journeyDetail.completionRate?.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {journeyDetail.totalCompleted} /{" "}
                            {journeyDetail.totalStarted} completed
                          </div>
                        </div>
                      </div>

                      <JourneyFlowDiagram
                        steps={journeyDetail.steps || []}
                        totalStarted={journeyDetail.totalStarted || 0}
                        className="border rounded-lg"
                      />
                    </div>
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
