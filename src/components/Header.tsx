import cn from 'classnames';
import { useCallback, useContext, useState } from 'react';
import { ErrorMessage, Todo } from '../types';
import { USER_ID, addTodo, patchTodo } from '../api/todos';
import { TEMP_ITEM_ID } from '../utils';
import {
  InputFieldRefContext,
  SetErrorMessageContext,
  SetIsChangingStatusContext,
  SetTodosContext,
  TodosContext,
} from '../contexts';

type Props = {
  setTempTodo: (tempTodo: Todo | null) => void;
  toggledAllCompleted: boolean;
};

export const Header: React.FC<Props> = ({
  setTempTodo,
  toggledAllCompleted,
}) => {
  const [title, setTitle] = useState('');

  const todos = useContext(TodosContext);
  const setTodos = useContext(SetTodosContext);
  const inputFieldRef = useContext(InputFieldRefContext);
  const setErrorMessage = useContext(SetErrorMessageContext);
  const setIsChangingStatus = useContext(SetIsChangingStatusContext);

  const handleToggleAllStatusClick = useCallback(() => {
    setErrorMessage(ErrorMessage.noError);
    setIsChangingStatus(true);

    const updatedTodosPromises = todos.map(async todo => {
      if (todo.completed === !toggledAllCompleted) {
        return todo;
      }

      const updatedTodo = {
        ...todo,
        completed: !toggledAllCompleted,
      };

      try {
        await patchTodo(updatedTodo);

        return updatedTodo;
      } catch {
        setErrorMessage(ErrorMessage.update);

        return todo;
      }
    });

    Promise.all(updatedTodosPromises)
      .then(updatedTodos => setTodos(updatedTodos))
      .finally(() => setIsChangingStatus(false));
  }, [
    todos,
    setIsChangingStatus,
    toggledAllCompleted,
    setTodos,
    setErrorMessage,
  ]);

  const submitTodo = (e: React.FormEvent) => {
    e.preventDefault();

    const preparedTitle = title.trim();

    if (!preparedTitle) {
      setErrorMessage(ErrorMessage.title);

      return;
    }

    const todoToAdd = {
      title: preparedTitle,
      userId: USER_ID,
      completed: false,
    };

    if (inputFieldRef?.current) {
      inputFieldRef.current.disabled = true;
    }

    setTempTodo({
      ...todoToAdd,
      id: TEMP_ITEM_ID,
    });
    setErrorMessage(ErrorMessage.noError);

    addTodo(todoToAdd)
      .then(todo => {
        setTodos(prevTodos => prevTodos.concat(todo));
        setTitle('');
      })
      .catch(() => setErrorMessage(ErrorMessage.add))
      .finally(() => {
        if (inputFieldRef?.current) {
          inputFieldRef.current.disabled = false;
          inputFieldRef.current.focus();
        }

        setTempTodo(null);
      });
  };

  return (
    <header className="todoapp__header">
      {/* this button should have `active` class only if all todos are completed */}
      {todos.length !== 0 && (
        <button
          type="button"
          className={cn('todoapp__toggle-all', {
            active: toggledAllCompleted,
          })}
          data-cy="ToggleAllButton"
          aria-label="toggle All todos"
          onClick={handleToggleAllStatusClick}
        />
      )}

      {/* Add a todo on form submit */}
      <form onSubmit={submitTodo}>
        <input
          data-cy="NewTodoField"
          value={title}
          onChange={e => setTitle(e.target.value)}
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          autoFocus
          ref={inputFieldRef}
        />
      </form>
    </header>
  );
};
