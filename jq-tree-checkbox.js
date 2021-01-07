(function ($) {
  /**
   * @typedef ListItem
   * @property {number} [checked] 是否选中。0 未选中，1 已选中，2 子项存在已选中
   * @property {ListItem[]} [children] 子级列表
   */
  $(function () {
    // 未选中
    const UNCHECKED = 0;
    // 已选中
    const CHECKED = 1;
    // 子项存在已选中（排除 子项全部选中 和 子项全部未选中）
    const INDETERMINATE = 2;

    // 存储所有数据
    let data = [];
    // 插件容器选择器
    let containerName = '';
    // 插件容器
    let $container = null;
    // label 名称，通过 data-label 指定
    let labelName = '';
    // value 名称，通过 data-value 指定
    let valueName = '';
    // 是否已完成初始化
    let initFinished = false;

    // 存储回调方法
    const callbacks = {};

    // 绑定方法到 jQuery
    $.extend($.fn, { initTree, getTreeSelected, setTreeSelected });

    /**
     * 初始化数据
     * @param {string} selector 选择器
     * @param {ListItem[]} list 所有数据
     * @param {Object} [options] 选项
     * @param {(item: ListItem) => void} [options.itemClick] 点击 item 事件
     * @param {(item: ListItem) => void} [options.itemChange] 选中 item 事件
     */
    function initTree(selector, list, options) {
      containerName = selector;
      $container = $(selector);
      labelName = $container.data('label') || 'label';
      valueName = $container.data('value') || 'value';

      if (options.itemClick) callbacks.itemClick = options.itemClick;
      if (options.itemChange) callbacks.itemChange = options.itemChange;

      addStyle();

      data = initData(list);
      const html = getListHtml(data);
      $container.append(html);

      bindEvents();

      initFinished = true;
    }

    /**
     * 获取已选中的数据
     * @return {ListItem[]} 已选中的数据
     */
    function getTreeSelected() {
      if (!initFinished) throw new Error('未初始化，请先调用 `initTree` 方法');
      const result = [];
      const fn = arr => {
        arr.forEach(i => {
          if (i.checked === CHECKED) result.push(i);
          i.children && fn(i.children);
        });
      };
      fn(data);
      return result;
    }

    /**
     * 设置已选中的数据
     * @param {(number | string)[]} selectedList 已选中的 value 值
     */
    function setTreeSelected(selectedList) {
      if (!initFinished) throw new Error('未初始化，请先调用 `initTree` 方法');
      const fn = (arr, parent) => {
        arr.forEach(i => {
          if (selectedList.includes(i[valueName])) {
            i.checked = CHECKED;
            if (parent && parent.checked !== CHECKED) {
              setParent(parent, INDETERMINATE);
            }
          }
          i.children && fn(i.children, i);
        });
      };
      fn(data);

      const html = getListHtml(data);
      $container.html('').append(html);

      $.each($container.find('.custom-control-input'), (i, v) => {
        switch (data[i].checked) {
          case UNCHECKED:
            $(v).prop('checked', false);
            break;
          case CHECKED:
            $(v).prop('checked', true);
            break;
          case INDETERMINATE:
            $(v).prop('indeterminate', true);
            break;
        }
      });
    }

    /**
     * 添加样式
     */
    function addStyle() {
      const style = `
      <style>
        .jq-tree-checkbox {
          display: flex;
          height: 500px;
        }
        .jq-tree-checkbox .list-group {
          flex: 1;
          height: 100%;
          overflow: auto;
        }
        .jq-tree-checkbox .list-group li {
          cursor: pointer;
        }
        .jq-tree-checkbox .list-group li label:hover {
          cursor: pointer;
          color: #007bff;
        }
      </style>`;
      $('head').append(style);
    }

    /**
     * 递归修改父级的选中状态
     * @param parent 父级数据
     * @param checked 需要设置的选中状态
     */
    function setParent(parent, checked) {
      parent.checked = checked;
      if (parent._parent) setParent(parent._parent, checked);
    }

    /**
     * 初始化数据，设置 _parent 以方便后续从子级往父级遍历
     * @param {ListItem[]} list 所有数据
     * @return {ListItem[]}
     */
    function initData(list) {
      const fn = (arr, parent) => {
        arr.forEach(i => {
          if (parent) Object.defineProperty(i, '_parent', { writable: false, value: parent });
          i.children && fn(i.children, i);
        });
      };
      fn(list);
      return list;
    }

    /**
     * 生成列表的 HTML 代码
     * @param {ListItem[]} arr 列表数据
     * @param {string[]} indexList 下标列表
     * @return {string} HTML 代码
     */
    function getListHtml(arr, indexList = []) {
      const htmlList = arr.map((item, index) => {
        const indexListStr = [...indexList, index].join('-');
        return `
        <li class="list-group-item" data-index-list="${indexListStr}">
          <div class="custom-control custom-checkbox">
            <input
              type="checkbox"
              class="custom-control-input"
              id="_checkout-${indexListStr}-${index}"
              value="${item[valueName]}"
            >
            <label class="custom-control-label" for="_checkout-${indexListStr}-${index}">${item[labelName]}</label>
          </div>
        </li>`;
      });
      return `<ul class="list-group">${htmlList.join('\n')}</ul>`;
    }

    /**
     * 从下标列表获取对应列表
     * @param {string[]} indexList 下标列表
     * @return {ListItem[]}
     */
    function getDataFromIndexList(indexList) {
      let result = null;
      indexList.forEach(i => {
        result = result ? result.children[i] : data[i];
      });
      return result;
    }

    /**
     * 递归更新所有子级
     * @param {ListItem[]} arr 子级列表
     * @param {number} checked 需要设置的选中状态
     */
    function updateAllChildren(arr, checked) {
      arr.forEach(i => {
        i.checked = checked;
        i.children && updateAllChildren(i.children, checked);
      });
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
      $container.on('click', '.list-group-item', handleItemClick);
      $container.on('input', '.custom-control-input', handleItemSelect);
    }

    /**
     * 点击 li 事件
     * @param {Event} e
     */
    function handleItemClick(e) {
      const $this = $(this);

      // 排除一个点击事件，解决事件触发两次的问题
      if (e.target.className === 'custom-control-label') return;

      const index = $this.parents('.list-group').index();
      for (let i = $container.find('.list-group').length - 1; i > index; i--) {
        $container.find('.list-group').eq(i).remove();
      }

      const indexList = String($this.data('index-list')).split('-');
      const curr = getDataFromIndexList(indexList);

      if (curr.children) {
        const $html = $(getListHtml(curr.children, indexList));
        $.each($html.find('.custom-control-input'), (i, v) => {
          switch (curr.children[i].checked) {
            case UNCHECKED:
              $(v).prop('checked', false);
              break;
            case CHECKED:
              $(v).prop('checked', true);
              break;
            case INDETERMINATE:
              $(v).prop('indeterminate', true);
              break;
          }
        });

        $container.append($html);
      }
      callbacks.itemClick && callbacks.itemClick(curr);
    }

    /**
     * 更改 checkbox 事件
     */
    function handleItemSelect() {
      const $this = $(this);

      // 当前 checkbox 选中状态
      const checked = $this.prop('checked') ? CHECKED : UNCHECKED;

      const $listGroup = $container.find('.list-group');
      const $currListGroup = $this.parents('.list-group');

      const currIndex = $currListGroup.index();
      const itemLength = $currListGroup.find('.custom-control-input').length;
      const checkedItemLength = $currListGroup.find('.custom-control-input:checked').length;
      const indexList = String($this.parents('.list-group-item').data('index-list')).split('-');

      const curr = getDataFromIndexList(indexList);
      curr.checked = checked;

      // 遍历所有 list-group 并设置对应 checkbox 的属性
      $.each($listGroup, (i, v) => {
        const $input = $(v).find('.custom-control-input');
        if (i > currIndex) {
          // 当前右侧的列表，也就是子级
          $input.prop('checked', !!checked);
          curr.children && updateAllChildren(curr.children, checked);
        } else if (i < currIndex) {
          // 当前左侧的列表，也就是父级
          const $parent = $input.eq(indexList[i]);
          switch (checkedItemLength) {
            case 0:
              // 当前列表没有一个选中，设置父级为未选中
              $parent.prop('indeterminate', false).prop('checked', false);
              setParent(curr._parent, UNCHECKED);
              break;
            case itemLength:
              // 当前列表全部选中，设置父级为已选中
              $parent.prop('indeterminate', false).prop('checked', true);
              setParent(curr._parent, CHECKED);
              break;
            default:
              // 根据当前列表是否存在已选中设置父级的状态
              $parent.prop('checked', false).prop('indeterminate', !!checkedItemLength);
              setParent(curr._parent, checkedItemLength ? INDETERMINATE : UNCHECKED);
          }
        }
      });

      callbacks.itemChange && callbacks.itemChange(curr);
    }
  });
})(jQuery);
