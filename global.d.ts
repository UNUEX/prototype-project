// global.d.ts
import * as React from "react";

declare global {
  namespace JSX {
    // Тип, который используется в React.createElement / TSX
    type Element = React.ReactElement;
    // Шаблон для всех встроенных элементов
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
