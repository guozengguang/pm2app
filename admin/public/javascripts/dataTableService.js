/**
 * Created by Administrator on 2016/12/29 0029.
 */

angular
    .module('cms')
    .service('DataTableService', function (DTOptionsBuilder) {
        this.dtOptions = DTOptionsBuilder.newOptions()
            .withButtons([
                { extend: 'colvis' },
                { extend: 'copy' },
                { extend: 'csv' },
                { extend: 'excel', title: 'ExampleFile' },
                { extend: 'pdf', title: 'ExampleFile' },
                {
                    extend: 'print',
                    customize: function (win) {
                        angular.element(win.document.body).addClass('white-bg');
                        angular.element(win.document.body).css('font-size', '10px');

                        angular.element(win.document.body).find('table')
                            .addClass('compact')
                            .css('font-size', 'inherit');
                    }
                }
            ])
            .withDOM('<"html5buttons"B>lTfgitp')
            .withLanguage({
                "sProcessing": "处理中...",
                "sLengthMenu": "显示_MENU_条",
                "sZeroRecords": "没有匹配结果",
                "sInfo": "",//显示第_START_至_END_条，共_TOTAL_条
                "sInfoEmpty": "",
                "sInfoFiltered": "(由_MAX_项结果过滤)",
                "sInfoPostFix": "",
                "sSearch": "搜索:",
                "sUrl": "",
                "sEmptyTable": "表中数据为空",
                "sLoadingRecords": "载入中...",
                "sInfoThousands": ",",
                "oPaginate": {
                    "sFirst": "首页",
                    "sPrevious": "上页",
                    "sNext": "下页",
                    "sLast": "末页"
                },
                "oAria": {
                    "sSortAscending": ":以升序排列此列",
                    "sSortDescending": ":以降序排列此列"
                }
            })
    })
