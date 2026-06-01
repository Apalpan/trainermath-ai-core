type SystemDiagramProps = {
  nodes: string[];
  caption?: string;
};

export default function SystemDiagram({ nodes, caption }: SystemDiagramProps) {
  return (
    <figure className="system-diagram">
      <div className="system-diagram__nodes">
        {nodes.map((node, index) => (
          <div className="system-node" key={`${node}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{node}</strong>
          </div>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
