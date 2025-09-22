import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Search, Target, Users, TrendingUp } from 'lucide-react';
import type { StageNarrative, QualificationNarrative } from '../types.v3';

interface StageNarrativeSectionProps {
  stageName: string;
  narrative: StageNarrative;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closing';
}

export function StageNarrativeSection({
  stageName,
  narrative,
  className = '',
  icon,
  variant = 'default'
}: StageNarrativeSectionProps) {
  const variantStyles = {
    default: 'border-border',
    discovery: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
    qualification: 'border-green-200 bg-green-50/50 dark:bg-green-950/20',
    proposal: 'border-purple-200 bg-purple-50/50 dark:bg-purple-950/20',
    negotiation: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20',
    closing: 'border-red-200 bg-red-50/50 dark:bg-red-950/20'
  };

  const defaultIcons = {
    discovery: <Search className="h-4 w-4" />,
    qualification: <CheckCircle className="h-4 w-4" />,
    proposal: <Target className="h-4 w-4" />,
    negotiation: <Users className="h-4 w-4" />,
    closing: <TrendingUp className="h-4 w-4" />
  };

  const stageIcon = icon || defaultIcons[variant as keyof typeof defaultIcons] || <AlertCircle className="h-4 w-4" />;

  const renderMarkdownContent = (content: string) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children, ...props }) => (
            <p className="mb-2 text-muted-foreground leading-relaxed" {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-1 mb-2" {...props}>
              {children}
            </ul>
          ),
          li: ({ children, ...props }) => (
            <li className="text-muted-foreground text-sm" {...props}>
              {children}
            </li>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  return (
    <Card className={`${variantStyles[variant]} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {stageIcon}
          <CardTitle className="text-lg font-semibold">{stageName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            Stage Analysis
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main summary */}
        <div>
          <h4 className="text-sm font-medium mb-2 text-foreground">Summary</h4>
          {renderMarkdownContent(narrative.summary)}
        </div>

        {/* Key findings */}
        {narrative.key_findings && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">Key Findings</h4>
            {renderMarkdownContent(narrative.key_findings)}
          </div>
        )}

        {/* Concerns */}
        {narrative.concerns && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">Concerns & Considerations</h4>
            {renderMarkdownContent(narrative.concerns)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized component for qualification narratives with BANT/MEDDICC
export function QualificationNarrativeSection({
  narrative,
  className = '',
  showTabs = true
}: {
  narrative: QualificationNarrative;
  className?: string;
  showTabs?: boolean;
}) {
  const renderMarkdownContent = (content: string) => (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children, ...props }) => (
            <p className="mb-2 text-muted-foreground leading-relaxed" {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-1 mb-2" {...props}>
              {children}
            </ul>
          ),
          li: ({ children, ...props }) => (
            <li className="text-muted-foreground text-sm" {...props}>
              {children}
            </li>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  if (!showTabs) {
    return (
      <Card className={`border-green-200 bg-green-50/50 dark:bg-green-950/20 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <CardTitle className="text-lg font-semibold">Qualification Analysis</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">Summary</h4>
            {renderMarkdownContent(narrative.summary)}
          </div>

          {narrative.bant_analysis && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">BANT Analysis</h4>
              {renderMarkdownContent(narrative.bant_analysis)}
            </div>
          )}

          {narrative.meddicc_analysis && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">MEDDICC Analysis</h4>
              {renderMarkdownContent(narrative.meddicc_analysis)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-green-200 bg-green-50/50 dark:bg-green-950/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <CardTitle className="text-lg font-semibold">Qualification Analysis</CardTitle>
          <Badge variant="outline" className="text-xs">
            Strategic Assessment
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary first */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 text-foreground">Executive Summary</h4>
          {renderMarkdownContent(narrative.summary)}
        </div>

        <Separator className="my-4" />

        {/* Tabbed analysis */}
        <Tabs defaultValue="bant" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bant" className="text-xs">
              BANT Analysis
            </TabsTrigger>
            <TabsTrigger value="meddicc" className="text-xs">
              MEDDICC Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bant" className="mt-4">
            {narrative.bant_analysis ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Budget • Authority • Need • Timeline</span>
                </div>
                {renderMarkdownContent(narrative.bant_analysis)}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">BANT analysis not available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="meddicc" className="mt-4">
            {narrative.meddicc_analysis ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Metrics • Economic Buyer • Decision Criteria • Decision Process • Identify Pain • Champion • Competition</span>
                </div>
                {renderMarkdownContent(narrative.meddicc_analysis)}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">MEDDICC analysis not available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Quick access components for each stage
export function DiscoveryNarrative({ narrative, className }: {
  narrative: StageNarrative;
  className?: string;
}) {
  return (
    <StageNarrativeSection
      stageName="Discovery"
      narrative={narrative}
      variant="discovery"
      className={className}
    />
  );
}

export function ProposalNarrative({ narrative, className }: {
  narrative: StageNarrative;
  className?: string;
}) {
  return (
    <StageNarrativeSection
      stageName="Proposal"
      narrative={narrative}
      variant="proposal"
      className={className}
    />
  );
}

export function NegotiationNarrative({ narrative, className }: {
  narrative: StageNarrative;
  className?: string;
}) {
  return (
    <StageNarrativeSection
      stageName="Negotiation"
      narrative={narrative}
      variant="negotiation"
      className={className}
    />
  );
}

export function ClosingNarrative({ narrative, className }: {
  narrative: StageNarrative;
  className?: string;
}) {
  return (
    <StageNarrativeSection
      stageName="Closing"
      narrative={narrative}
      variant="closing"
      className={className}
    />
  );
}








