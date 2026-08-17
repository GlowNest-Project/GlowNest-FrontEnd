export default function AnimatedText({
  as: Component = "span",
  children,
  className = "",
  delay = 0,
  mode = "letter",
}) {
  const text = String(children);
  const words = text.split(" ");
  let letterCount = 0;

  if (mode === "word") {
    return (
      <Component className={className} aria-label={text}>
        {words.map((word, wordIndex) => (
          <span
            className="letter-word word-sweep"
            aria-hidden="true"
            key={`${word}-${wordIndex}`}
            style={{ "--letter-delay": `${delay + wordIndex * 120}ms` }}
          >
            {word}
            {wordIndex < words.length - 1 && "\u00A0"}
          </span>
        ))}
      </Component>
    );
  }

  return (
    <Component className={className} aria-label={text}>
      {words.map((word, wordIndex) => (
        <span className="letter-word" aria-hidden="true" key={`${word}-${wordIndex}`}>
          {Array.from(word).map((letter, letterIndex) => {
            const currentDelay = delay + letterCount * 38;
            letterCount += 1;

            return (
              <span
                className="letter-sweep"
                key={`${letter}-${wordIndex}-${letterIndex}`}
                style={{ "--letter-delay": `${currentDelay}ms` }}
              >
                {letter}
              </span>
            );
          })}
          {wordIndex < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </Component>
  );
}
