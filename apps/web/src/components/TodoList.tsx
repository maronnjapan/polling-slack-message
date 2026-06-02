export function TodoList({ todos }: { todos: string[] }) {
  return (
    <ul className="todo">
      {todos.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}
