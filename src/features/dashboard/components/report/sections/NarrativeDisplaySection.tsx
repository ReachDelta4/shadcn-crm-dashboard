import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, User, TrendingUp, Hash } from 'lucide-react';
import type { NarrativeSection, NarrativeSectionWithTopics, NarrativeSectionWithCompetitors } from '../types.v3';

interface NarrativeDisplaySectionProps {
  title: string;
  narrative: NarrativeSection | NarrativeSectionWithTopics | NarrativeSectionWithCompetitors;
  className?: string;
  showMetadata?: boolean;
  variant?: 'default' | 'executive' | 'technical' | 'competitive';
}

export function NarrativeDisplaySection({
  title,
  narrative,
  className = '',
  showMetadata = true,
  variant = 'default'
}: NarrativeDisplaySectionProps) {
  const variantStyles = {
    default: 'border-border',
    executive: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20',
    technical: 'border-green-200 bg-green-50/50 dark:bg-green-950/20',
    competitive: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20'
  };

  const formatSentiment = (sentiment?: number) => {
    if (sentiment === undefined) return null;
    
    const value = Math.round(sentiment * 100);
    let color = 'bg-gray-500';
    let label = 'Neutral';
    
    if (sentiment > 0.6) {
      color = 'bg-green-500';
      label = 'Positive';
    } else if (sentiment > 0.3) {
      color = 'bg-yellow-500';
      label = 'Moderate';
    } else if (sentiment < -0.3) {
      color = 'bg-red-500';
      label = 'Negative';
    }
    
    return (
      <div className="flex items-center gap-2">
        <TrendingUp className="h-3 w-3" />
        <span className="text-xs text-muted-foreground">Sentiment:</span>
        <Badge variant="outline" className={`text-xs ${color} text-white border-none`}>
          {label} ({value}%)
        </Badge>
      </div>
    );
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    
    try {
      const date = new Date(timestamp);
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span className="text-xs text-muted-foreground">
            Generated: {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </span>
        </div>
      );
    } catch {
      return null;
    }
  };

  const renderTopics = (topics?: string[]) => {
    if (!topics || topics.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Hash className="h-3 w-3" />
          <span className="text-xs font-medium text-muted-foreground">Topics Covered:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {topics.map((topic, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderParticipants = (participants?: string[]) => {
    if (!participants || participants.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <span className="text-xs font-medium text-muted-foreground">Participants:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {participants.map((participant, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {participant}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderCompetitors = (competitors?: string[]) => {
    if (!competitors || competitors.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium text-muted-foreground">Competitors Mentioned:</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {competitors.map((competitor, index) => (
            <Badge key={index} variant="destructive" className="text-xs">
              {competitor}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderKeyTerms = (terms?: string[]) => {
    if (!terms || terms.length === 0) return null;
    
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Key Terms:</span>
        <div className="flex flex-wrap gap-1">
          {terms.slice(0, 5).map((term, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {term}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={`${variantStyles[variant]} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {narrative.metadata?.word_count && (
            <Badge variant="outline" className="text-xs">
              {narrative.metadata.word_count} words
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main narrative content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h2: ({ children, ...props }) => (
                <h2 className="text-xl font-semibold mb-3 mt-4 text-foreground" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="text-lg font-medium mb-2 mt-3 text-foreground" {...props}>
                  {children}
                </h3>
              ),
              p: ({ children, ...props }) => (
                <p className="mb-3 text-muted-foreground leading-relaxed" {...props}>
                  {children}
                </p>
              ),
              strong: ({ children, ...props }) => (
                <strong className="font-semibold text-foreground" {...props}>
                  {children}
                </strong>
              ),
              ul: ({ children, ...props }) => (
                <ul className="list-disc list-inside space-y-1 mb-3" {...props}>
                  {children}
                </ul>
              ),
              li: ({ children, ...props }) => (
                <li className="text-muted-foreground" {...props}>
                  {children}
                </li>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote 
                  className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground bg-muted/50 py-2 rounded-r" 
                  {...props}
                >
                  {children}
                </blockquote>
              )
            }}
          >
            {narrative.content}
          </ReactMarkdown>
        </div>

        {/* Metadata section */}
        {showMetadata && narrative.metadata && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Analysis Metadata</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  {formatTimestamp(narrative.metadata.generated_at)}
                  {formatSentiment(narrative.metadata.sentiment)}
                  {renderKeyTerms(narrative.metadata.key_terms)}
                </div>
                
                <div className="space-y-2">
                  {renderTopics((narrative.metadata as any).topics_covered)}
                  {renderParticipants((narrative.metadata as any).participants_mentioned)}
                  {renderCompetitors((narrative.metadata as any).competitors_mentioned)}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized variants for different narrative types
export function ExecutiveSummaryNarrative({ narrative, className, showMetadata = true }: {
  narrative: NarrativeSection;
  className?: string;
  showMetadata?: boolean;
}) {
  return (
    <NarrativeDisplaySection
      title="Executive Summary"
      narrative={narrative}
      variant="executive"
      className={className}
      showMetadata={showMetadata}
    />
  );
}

export function MeetingSummaryNarrative({ narrative, className, showMetadata = true }: {
  narrative: NarrativeSectionWithTopics;
  className?: string;
  showMetadata?: boolean;
}) {
  return (
    <NarrativeDisplaySection
      title="Meeting Summary"
      narrative={narrative}
      variant="default"
      className={className}
      showMetadata={showMetadata}
    />
  );
}

export function TechnicalEvaluationNarrative({ narrative, className, showMetadata = true }: {
  narrative: NarrativeSection;
  className?: string;
  showMetadata?: boolean;
}) {
  return (
    <NarrativeDisplaySection
      title="Technical Evaluation"
      narrative={narrative}
      variant="technical"
      className={className}
      showMetadata={showMetadata}
    />
  );
}

export function CompetitiveLandscapeNarrative({ narrative, className, showMetadata = true }: {
  narrative: NarrativeSectionWithCompetitors;
  className?: string;
  showMetadata?: boolean;
}) {
  return (
    <NarrativeDisplaySection
      title="Competitive Landscape"
      narrative={narrative}
      variant="competitive"
      className={className}
      showMetadata={showMetadata}
    />
  );
}








