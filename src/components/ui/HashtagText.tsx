interface HashtagTextProps {
  text: string;
  onTagClick?: (tag: string) => void;
}

export default function HashtagText({ text, onTagClick }: HashtagTextProps) {
  // 해시태그 정규식 (앞에 공백이나 줄바꿈이 있는 #태그 형태)
  const tagRegex = /(#[^\s#]+)/g;
  const parts = text.split(tagRegex);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.match(tagRegex)) {
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(part.substring(1)); // # 제외하고 전달
              }}
              className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition-colors"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}
