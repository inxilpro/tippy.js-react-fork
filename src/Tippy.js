import React, {forwardRef, cloneElement, useState} from 'react';
import PropTypes from 'prop-types';
import {createPortal} from 'react-dom';
import tippy from 'tippy.js';
import {preserveRef, ssrSafeCreateDiv} from './utils';
import {
  useInstance,
  useIsomorphicLayoutEffect,
  useUpdateClassName,
} from './hooks';

export function Tippy({
  children,
  content,
  className,
  plugins,
  visible,
  singleton,
  enabled = true,
  multiple = true,
  ignoreAttributes = true,
  ...restOfNativeProps
}) {
  const isControlledMode = visible !== undefined;
  const isSingletonMode = singleton !== undefined;

  const [mounted, setMounted] = useState(false);
  const component = useInstance(() => ({
    container: ssrSafeCreateDiv(),
    renders: 1,
  }));

  const props = {
    ignoreAttributes,
    multiple,
    ...restOfNativeProps,
    content: component.container,
  };

  if (isControlledMode) {
    props.trigger = 'manual';
  }

  if (isSingletonMode) {
    enabled = false;
  }

  // CREATE
  useIsomorphicLayoutEffect(() => {
    const instance = tippy(component.ref, props, plugins);

    component.instance = instance;

    if (!enabled) {
      instance.disable();
    }

    if (visible) {
      instance.show();
    }

    if (isSingletonMode) {
      singleton(instance);
    }

    setMounted(true);

    return () => {
      instance.destroy();
    };
  }, [children.type]);

  // UPDATE
  useIsomorphicLayoutEffect(() => {
    // Prevent this effect from running on 1st render
    if (component.renders === 1) {
      component.renders++;
      return;
    }

    const {instance} = component;

    instance.setProps(props);

    if (enabled) {
      instance.enable();
    } else {
      instance.disable();
    }

    if (isControlledMode) {
      if (visible) {
        instance.show();
      } else {
        instance.hide();
      }
    }
  });

  useUpdateClassName(component, className, children.type);

  return (
    <>
      {cloneElement(children, {
        ref(node) {
          component.ref = node;
          preserveRef(children.ref, node);
        },
      })}
      {mounted && createPortal(content, component.container)}
    </>
  );
}

if (process.env.NODE_ENV !== 'production') {
  const ContentType = PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.element,
  ]);

  Tippy.propTypes = {
    content: PropTypes.oneOfType([ContentType, PropTypes.arrayOf(ContentType)])
      .isRequired,
    children: PropTypes.element.isRequired,
    visible: PropTypes.bool,
    enabled: PropTypes.bool,
    className: PropTypes.string,
    singleton: PropTypes.func,
  };
}

export default forwardRef(function TippyWrapper({children, ...props}, ref) {
  return (
    <Tippy {...props}>
      {cloneElement(children, {
        ref(node) {
          preserveRef(ref, node);
          preserveRef(children.ref, node);
        },
      })}
    </Tippy>
  );
});
