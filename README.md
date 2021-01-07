# jq-tree-checkbox

树形级联多选框列表

## 依赖

- `jQuery`
- `bootstrap.min.css`（4.x 版本）

## 使用

### HTML

```html
<div style="height: 500px" class="jq-tree-checkbox" data-label="name" data-value="code"></div>
```

- `data-label`：指定显示的 `label` 的 `key`（与 `checkbox` 绑定的 `label` 标签的内容）
- `data-value`：指定 `checkbox` 的 `value` 值绑定的 `key`

### JS

#### 数据格式

```json5
[
  {
    // ...,
    "children": [
      {
        // ...,
        "children": []
      }
    ]
  },
  { /* ... */ },
  // ...
]
```

#### 初始化

```js
$.fn.initTree('.jq-tree-checkbox', DATA);
```

#### 监听事件

```js
$.fn.initTree('.jq-tree-checkbox', DATA, {
  // 可选，点击 li 触发（选中也会触发）的事件
  itemClick(item) {
    console.log('click', item);
  },
  // 可选，checkbox 改变时触发的事件
  itemChange(item) {
    console.log('change', item);
  }
});
```

#### 设置已选中的数据

```js
$.fn.setTreeSelected(['130102']);
```

#### 获取已选中的数据

```js
const result = $.fn.getTreeSelected();
console.log(result);
```
