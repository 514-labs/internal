"use client";

import type { HydratedKeyResult } from "@/lib/goals/client";
import {
  GoalProgress,
  KeyResultsList,
  LinkedInitiatives,
} from "@/components/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, FileText } from "lucide-react";

interface GoalDetailContentProps {
  keyResults: HydratedKeyResult[];
  progress: number;
  initiativeIds: string[];
  htmlContent?: string;
}

export function GoalDetailContent({
  keyResults,
  progress,
  initiativeIds,
  htmlContent,
}: GoalDetailContentProps) {

  return (
    <div className="space-y-8">
      {/* Progress overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <GoalProgress progress={progress} size="lg" />
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{progress}%</p>
              <p className="text-sm text-muted-foreground">
                {keyResults.length} key result
                {keyResults.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Key Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <KeyResultsList keyResults={keyResults} />
        </CardContent>
      </Card>

      {/* Work / Linked Initiatives */}
      <LinkedInitiatives
        initiativeIds={initiativeIds}
        showEmptyState={true}
      />

      {/* MDX Content */}
      {htmlContent && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
