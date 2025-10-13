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

interface MoosestackJourneysCardProps {
  startDate: string;
  endDate: string;
}

const journeyIds = [
  "moosestack-discovery",
  "moosestack-first-value",
  "moosestack-adoption",
];

const journeyLabels: Record<string, string> = {
  "moosestack-discovery": "Discovery",
  "moosestack-first-value": "First Value",
  "moosestack-adoption": "Adoption",
};

export function MoosestackJourneysCard({
  startDate,
  endDate,
}: MoosestackJourneysCardProps) {
  const [selectedJourney, setSelectedJourney] = React.useState(journeyIds[0]);

  // Fetch individual journey details
  const { data: journeyDetail, isLoading } = useQuery({
    queryKey: ["journey-detail", selectedJourney, startDate, endDate],
    queryFn: async () => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moosestack User Journeys</CardTitle>
        <CardDescription>
          Framework adoption and user progression funnels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={selectedJourney}
          onValueChange={setSelectedJourney}
          className="space-y-4"
        >
          <TabsList>
            {journeyIds.map((id) => (
              <TabsTrigger key={id} value={id}>
                {journeyLabels[id]}
              </TabsTrigger>
            ))}
          </TabsList>

          {journeyIds.map((id) => (
            <TabsContent key={id} value={id} className="space-y-4">
              {isLoading && selectedJourney === id ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : journeyDetail && selectedJourney === id ? (
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

                  {journeyDetail.steps && journeyDetail.steps.length > 0 ? (
                    <JourneyFlowDiagram
                      steps={journeyDetail.steps}
                      totalStarted={journeyDetail.totalStarted || 0}
                      className="border rounded-lg"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      No data available for this journey
                    </div>
                  )}
                </div>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
