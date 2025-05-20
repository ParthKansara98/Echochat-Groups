import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

const ThemeToggle = ({ currentTheme, toggleTheme }) => {
  return (
    <StyledWrapper>
      <label className="switch">
        <input 
          type="checkbox" 
          checked={currentTheme === 'dark'}
          onChange={toggleTheme}
        />
        <span className="slider">
          <FontAwesomeIcon icon={faMoon} className="moon-icon" />
          <FontAwesomeIcon icon={faSun} className="sun-icon" />
        </span>
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .switch {
    font-size: 20px;
    position: relative;
    display: inline-block;
    width: 4.2em;
    height: 2.4em;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    --background: var(--bg-secondary);
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--background);
    transition: .5s;
    border-radius: 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.6em;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 1.8em;
    width: 1.8em;
    border-radius: 50%;
    left: 8%;
    bottom: 12%;
    background: var(--primary);
    transition: .5s;
    z-index: 2;
  }

  .moon-icon, .sun-icon {
    font-size: 1em;
    color: var(--color-text-secondary);
    z-index: 1;
    transition: .5s;
  }

  .moon-icon {
    margin-right: auto;
  }

  .sun-icon {
    margin-left: auto;
  }

  input:checked + .slider {
    background-color: var(--bg-hover);
  }

  input:checked + .slider:before {
    transform: translateX(100%);
  }

  input:checked + .slider .moon-icon {
    color: var(--color-text-secondary);
  }

  input:checked + .slider .sun-icon {
    color: var(--color-warning);
  }

  input:not(:checked) + .slider .moon-icon {
    color: var(--color-primary);
  }

  input:not(:checked) + .slider .sun-icon {
    color: var(--color-text-secondary);
  }
`;

export default ThemeToggle;
