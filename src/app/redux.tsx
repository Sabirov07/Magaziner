// Define more specific types for your state and actions
interface State {
  // Define your state structure with specific types
  [key: string]: unknown;
}

// Define specific action types
type ActionType = 'UPDATE' | 'DELETE' | 'CREATE' | /* other action types */;

interface Action<T = unknown> {
  type: ActionType;
  payload: T;
}

// Remove unused _key parameter
const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // ... case statements
    default:
      return state;
  }
};

// Define specific payload types for different actions
interface UpdatePayload {
  id: string;
  data: Partial<State>;
}

interface DeletePayload {
  id: string;
}

// Use specific payload types
const handleUpdate = (state: State, payload: UpdatePayload): State => {
  // ... implementation
  return state;
};

const handleDelete = (state: State, payload: DeletePayload): State => {
  // ... implementation
  return state;
};

// Export types if needed
export type { State, Action, ActionType, UpdatePayload, DeletePayload }; 