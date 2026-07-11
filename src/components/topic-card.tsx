import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Topic } from "@/types";

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Link href={`/conversation?topicId=${topic.id}`} className="block group">
      <Card className="h-full transition-all duration-150 hover:shadow-md hover:border-foreground/20 hover:-translate-y-0.5 active:scale-[0.98]">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-3xl leading-none">{topic.emoji}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {topic.category}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <CardTitle className="text-lg">{topic.label}</CardTitle>
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription>{topic.description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
