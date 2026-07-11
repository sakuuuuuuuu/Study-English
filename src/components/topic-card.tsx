"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Topic } from "@/types";

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/conversation?topicId=${topic.id}`);
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl">{topic.emoji}</span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {topic.category}
          </Badge>
        </div>
        <CardTitle className="text-lg">{topic.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{topic.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
