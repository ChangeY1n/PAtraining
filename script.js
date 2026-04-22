// 专业交易记录系统
class ProfessionalTradingTracker {
    constructor() {
        this.transactions = [];
        this.currentDetailId = null;
        this.currentSort = {
            field: 'entryTime',
            direction: 'desc' // 'asc' or 'desc'
        };
        
        // 交易品种预设配置
        this.symbolPresets = {
            'XAUUSD': { name: '黄金/XAUUSD', lotValue: 100, decimalPlaces: 2 },
            'EURUSD': { name: '欧元/美元', lotValue: 100, decimalPlaces: 4 },
            'GBPUSD': { name: '英镑/美元', lotValue: 100, decimalPlaces: 4 },
            'USDJPY': { name: '美元/日元', lotValue: 100, decimalPlaces: 2 },
            'US30': { name: '道琼斯指数', lotValue: 1, decimalPlaces: 2 },
            'BTCUSD': { name: '比特币', lotValue: 1, decimalPlaces: 2 },
            'ETHUSD': { name: '以太坊', lotValue: 1, decimalPlaces: 2 },
            'AAPL': { name: '苹果股票', lotValue: 1, decimalPlaces: 2 },
            'TSLA': { name: '特斯拉股票', lotValue: 1, decimalPlaces: 2 },
            '其他': { name: '其他', lotValue: 100, decimalPlaces: 4 }
        };
        
        // 初始化
        this.init();

        // 初始化图表
        this.initCharts();
    }

    // 初始化ECharts图表
    initCharts() {
        // 各周期盈亏柱状图
        this.chartCycle = echarts.init(document.getElementById('chart-cycle'));

        // 入场时段胜率折线图
        this.chartHourly = echarts.init(document.getElementById('chart-hourly'));

        // 平仓理由饼图
        this.chartExit = echarts.init(document.getElementById('chart-exit'));

        // 渲染图表
        this.renderCharts();

        // 响应窗口变化
        window.addEventListener('resize', () => {
            this.chartCycle.resize();
            this.chartHourly.resize();
            this.chartExit.resize();
        });
    }

    // 渲染所有图表
    renderCharts() {
        this.renderCycleChart();
        this.renderHourlyChart();
        this.renderExitChart();
    }

    // 渲染各周期盈亏柱状图
    renderCycleChart() {
        const cycleData = {};
        this.transactions.forEach(t => {
            if (t.exitPrice) {
                if (!cycleData[t.tradeCycle]) {
                    cycleData[t.tradeCycle] = 0;
                }
                cycleData[t.tradeCycle] += t.actualProfitLoss || 0;
            }
        });

        const cycles = Object.keys(cycleData);
        const values = cycles.map(c => cycleData[c]);

        const option = {
            tooltip: {
                trigger: 'axis',
                formatter: '{b}: ¥{c}'
            },
            xAxis: {
                type: 'category',
                data: cycles,
                axisLabel: { color: '#94a3b8' },
                axisLine: { lineStyle: { color: '#475569' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: '#94a3b8',
                    formatter: '¥{value}'
                },
                axisLine: { lineStyle: { color: '#475569' } },
                splitLine: { lineStyle: { color: '#334155' } }
            },
            series: [{
                type: 'bar',
                data: values.map(v => ({
                    value: v,
                    itemStyle: {
                        color: v >= 0 ? '#10b981' : '#ef4444'
                    }
                })),
                barWidth: '50%',
                label: {
                    show: true,
                    position: 'top',
                    color: '#e2e8f0',
                    formatter: '¥{c}'
                }
            }],
            grid: { left: '10%', right: '10%', bottom: '15%', top: '10%' }
        };

        this.chartCycle.setOption(option);
    }

    // 渲染入场时段胜率折线图
    renderHourlyChart() {
        const hourlyStats = {};

        this.transactions.forEach(t => {
            if (t.exitPrice && t.entryTime) {
                const hour = new Date(t.entryTime.replace(' ', 'T')).getHours();
                if (!hourlyStats[hour]) {
                    hourlyStats[hour] = { total: 0, wins: 0 };
                }
                hourlyStats[hour].total++;
                if (t.actualProfitLoss > 0) {
                    hourlyStats[hour].wins++;
                }
            }
        });

        // 生成0-23小时的数据
        const hours = [];
        const winRates = [];
        for (let h = 0; h < 24; h++) {
            hours.push(h + '时');
            if (hourlyStats[h] && hourlyStats[h].total > 0) {
                winRates.push((hourlyStats[h].wins / hourlyStats[h].total * 100).toFixed(1));
            } else {
                winRates.push('-');
            }
        }

        const validData = winRates.map((v, i) => v === '-' ? null : [i, parseFloat(v)]).filter(v => v !== null);

        const option = {
            tooltip: {
                formatter: function(params) {
                    if (params && params.length > 0) {
                        return params[0].data[0] + '时: ' + params[0].data[1] + '%';
                    }
                    return '';
                }
            },
            xAxis: {
                type: 'category',
                data: hours,
                axisLabel: {
                    color: '#94a3b8',
                    interval: 2
                },
                axisLine: { lineStyle: { color: '#475569' } }
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLabel: {
                    color: '#94a3b8',
                    formatter: '{value}%'
                },
                axisLine: { lineStyle: { color: '#475569' } },
                splitLine: { lineStyle: { color: '#334155' } }
            },
            series: [{
                type: 'line',
                data: validData,
                smooth: true,
                lineStyle: { color: '#38bdf8', width: 2 },
                itemStyle: { color: '#38bdf8' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(56, 189, 248, 0.3)' },
                            { offset: 1, color: 'rgba(56, 189, 248, 0.05)' }
                        ]
                    }
                },
                label: {
                    show: true,
                    position: 'top',
                    color: '#38bdf8',
                    formatter: '{c}%'
                },
                connectNulls: true
            }],
            grid: { left: '10%', right: '10%', bottom: '15%', top: '10%' }
        };

        this.chartHourly.setOption(option);
    }

    // 渲染平仓理由饼图
    renderExitChart() {
        const exitData = {};
        this.transactions.forEach(t => {
            if (t.exitReason) {
                if (!exitData[t.exitReason]) {
                    exitData[t.exitReason] = 0;
                }
                exitData[t.exitReason]++;
            }
        });

        const data = Object.keys(exitData).map(key => ({
            name: key,
            value: exitData[key]
        }));

        const colors = ['#ef4444', '#10b981', '#38bdf8', '#fbbf24', '#8b5cf6', '#f97316'];

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}笔 ({d}%)'
            },
            legend: {
                orient: 'vertical',
                right: '5%',
                top: 'center',
                textStyle: { color: '#94a3b8' }
            },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['40%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#1e293b',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    color: '#e2e8f0',
                    formatter: '{b}: {c}'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                data: data.map((item, index) => ({
                    ...item,
                    itemStyle: { color: colors[index % colors.length] }
                }))
            }]
        };

        this.chartExit.setOption(option);
    }
    
    init() {
        // 从本地存储加载交易记录
        this.loadTransactions();
        
        // 初始化时间选择器
        this.initDateTimePickers();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 设置默认值
        this.setupFormDefaults();
        
        // 初始化排序功能
        this.initSorting();
        
        // 渲染初始数据
        this.renderTransactions();
        this.updateStats();
        
        // 初始化交易品种选择
        this.setupSymbolSelector();
    }
    
    // 初始化交易品种选择器
    setupSymbolSelector() {
        const symbolSelect = document.getElementById('trade-symbol');
        
        // 当交易品种改变时
        symbolSelect.addEventListener('change', (e) => {
            const selectedSymbol = e.target.value;
            this.updateSymbolPreset(selectedSymbol);
            this.calculateAllValues(); // 重新计算所有相关值
        });
        
        // 设置默认值
        this.updateSymbolPreset(symbolSelect.value);
    }
    
    // 更新交易品种预设值
    updateSymbolPreset(symbol) {
        const preset = this.symbolPresets[symbol] || { lotValue: 100, decimalPlaces: 4 };
        const lotValueInput = document.getElementById('standard-lot-value');
        
        // 更新标准手价格波动
        if (preset.lotValue) {
            lotValueInput.value = preset.lotValue;
        }
        
        // 更新小数位数提示
        this.updateDecimalPlacesHint(preset.decimalPlaces);
        
        // 重新计算所有值
        this.calculateAllValues();
    }
    
    // 更新小数位数提示
    updateDecimalPlacesHint(decimalPlaces) {
        // 这里可以添加小数位数提示，如果需要的话
    }
    
    // 计算标准手数量
    calculateStandardLots() {
        const positionSize = parseFloat(document.getElementById('position-size').value) || 0;
        const standardLots = positionSize; // 假设输入的就是标准手数量
        
        document.getElementById('standard-lots').textContent = standardLots.toFixed(2);
        return standardLots;
    }
    
    // 计算每点价值
    calculatePerPipValue() {
        const standardLots = this.calculateStandardLots();
        const lotValue = parseFloat(document.getElementById('standard-lot-value').value) || 0;
        const perPipValue = standardLots * lotValue;
        
        document.getElementById('per-pip-value').textContent = `¥${perPipValue.toFixed(2)}`;
        return perPipValue;
    }
    
    // 计算止损点数
    calculateStopPips() {
        const entryPrice = parseFloat(document.getElementById('entry-price').value) || 0;
        const stopLoss = parseFloat(document.getElementById('initial-stop').value) || 0;
        const direction = document.getElementById('trade-direction').value;
        
        if (entryPrice > 0 && stopLoss > 0) {
            let pips;
            if (direction === '多') {
                pips = Math.abs(entryPrice - stopLoss);
            } else { // 空
                pips = Math.abs(stopLoss - entryPrice);
            }
            
            document.getElementById('stop-pips').textContent = pips.toFixed(4);
            return pips;
        }
        
        document.getElementById('stop-pips').textContent = '0.0000';
        return 0;
    }
    
    // 计算目标点数
    calculateTargetPips() {
        const entryPrice = parseFloat(document.getElementById('entry-price').value) || 0;
        const target = parseFloat(document.getElementById('initial-target').value) || 0;
        const direction = document.getElementById('trade-direction').value;
        
        if (entryPrice > 0 && target > 0) {
            let pips;
            if (direction === '多') {
                pips = Math.abs(target - entryPrice);
            } else { // 空
                pips = Math.abs(entryPrice - target);
            }
            
            document.getElementById('target-pips').textContent = pips.toFixed(4);
            return pips;
        }
        
        document.getElementById('target-pips').textContent = '0.0000';
        return 0;
    }
    
    // 计算风险点数（初始风险）
    calculateRiskPips() {
        const entryPrice = parseFloat(document.getElementById('entry-price').value) || 0;
        const stopLoss = parseFloat(document.getElementById('initial-stop').value) || 0;
        const direction = document.getElementById('trade-direction').value;
        
        if (entryPrice > 0 && stopLoss > 0) {
            let riskPips;
            if (direction === '多') {
                riskPips = entryPrice - stopLoss;
            } else { // 空
                riskPips = stopLoss - entryPrice;
            }
            
            document.getElementById('risk-pips').textContent = Math.abs(riskPips).toFixed(4);
            return riskPips;
        }
        
        document.getElementById('risk-pips').textContent = '0.0000';
        return 0;
    }
    
    // 计算风险价值（初始风险价值）
    calculateRiskValue() {
        const riskPips = Math.abs(this.calculateRiskPips());
        const perPipValue = this.calculatePerPipValue();
        const riskValue = riskPips * perPipValue;
        
        document.getElementById('risk-value').textContent = `¥${riskValue.toFixed(2)}`;
        return riskValue;
    }
    
    // 计算实际风险百分比（相对于初始风险）
    calculateActualRiskPercent() {
        const initialRiskValue = this.calculateRiskValue();
        const actualRiskInput = parseFloat(document.getElementById('actual-risk').value) || 0;
        
        if (initialRiskValue > 0 && actualRiskInput > 0) {
            const percent = (actualRiskInput / initialRiskValue) * 100;
            const percentElement = document.getElementById('actual-risk-percent');
            
            percentElement.textContent = `${percent.toFixed(1)}%`;
            
            // 根据百分比设置颜色
            percentElement.className = '';
            if (percent <= 50) {
                percentElement.classList.add('low');
            } else if (percent <= 100) {
                // 50%-100% 之间保持默认颜色
            } else {
                percentElement.classList.add('high');
            }
            
            return percent;
        }
        
        document.getElementById('actual-risk-percent').textContent = '0%';
        document.getElementById('actual-risk-percent').className = '';
        return 0;
    }
    
    // 计算所有相关值
    calculateAllValues() {
        // 计算基本值
        this.calculateStandardLots();
        this.calculatePerPipValue();
        
        // 计算点数
        this.calculateStopPips();
        this.calculateTargetPips();
        this.calculateRiskPips();
        this.calculateRiskValue();
        
        // 计算实际风险百分比
        this.calculateActualRiskPercent();
        
        // 计算风险回报比
        const entryPrice = parseFloat(document.getElementById('entry-price').value) || 0;
        const stopLoss = parseFloat(document.getElementById('initial-stop').value) || 0;
        const target = parseFloat(document.getElementById('initial-target').value) || 0;
        const direction = document.getElementById('trade-direction').value;
        
        if (entryPrice > 0 && stopLoss > 0 && target > 0) {
            let risk, reward;
            
            if (direction === '多') {
                risk = entryPrice - stopLoss;
                reward = target - entryPrice;
            } else { // 空
                risk = stopLoss - entryPrice;
                reward = entryPrice - target;
            }
            
            if (risk > 0 && reward > 0) {
                const ratio = (reward / risk).toFixed(2);
                document.getElementById('risk-reward').value = `1:${ratio}`;
            }
        }
    }
    
    // 初始化时间选择器
    initDateTimePickers() {
        // 中文配置
        const chineseConfig = {
            locale: "zh",
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            minuteIncrement: 1
        };
        
        // 开仓时间选择器
        flatpickr("#entry-time", chineseConfig);
        
        // 平仓时间选择器
        flatpickr("#exit-time", chineseConfig);
    }
    
    // 设置表单默认值
    setupFormDefaults() {
        // 设置默认开仓时间为当前时间
        const now = new Date();
        document.getElementById('entry-time').value = 
            now.toISOString().slice(0, 16).replace('T', ' ');
        
        // 设置日期搜索的默认值（最近30天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        document.getElementById('date-from').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('date-to').value = new Date().toISOString().split('T')[0];
        
        // 为部分字段添加计算逻辑
        this.setupCalculations();
    }
    
    // 设置字段计算逻辑
    setupCalculations() {
        // 监听相关字段的变化，触发计算（不包括实际风险）
        const fieldsToWatch = [
            'trade-symbol', 'standard-lot-value', 'position-size',
            'entry-price', 'initial-stop', 'initial-target', 'trade-direction'
        ];
        
        fieldsToWatch.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.calculateAllValues();
            });
            document.getElementById(id).addEventListener('change', () => {
                this.calculateAllValues();
            });
        });
        
        // 监听实际风险输入变化，只更新百分比
        document.getElementById('actual-risk').addEventListener('input', () => {
            this.calculateActualRiskPercent();
        });
    }
    
    // 初始化排序功能
    initSorting() {
        // 为表头添加排序事件监听器
        const sortableHeaders = document.querySelectorAll('th[data-sort]');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                this.sortTransactions(field);
                this.updateSortIndicators(field);
            });
        });
    }
    
    // 更新排序指示器
    updateSortIndicators(currentField) {
        // 清除所有排序指示器
        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
            
            // 更新图标
            const icon = header.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sort';
            }
        });
        
        // 设置当前排序字段的指示器
        const currentHeader = document.querySelector(`th[data-sort="${currentField}"]`);
        if (currentHeader) {
            currentHeader.classList.add(`sort-${this.currentSort.direction}`);
            
            // 更新图标
            const icon = currentHeader.querySelector('i');
            if (icon) {
                if (this.currentSort.direction === 'asc') {
                    icon.className = 'fas fa-sort-up';
                } else {
                    icon.className = 'fas fa-sort-down';
                }
            }
        }
    }
    
    // 从本地存储加载交易记录
    loadTransactions() {
        const savedTransactions = localStorage.getItem('professionalTradingTransactions');
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }
    }
    
    // 保存交易记录到本地存储
    saveTransactions() {
        localStorage.setItem('professionalTradingTransactions', JSON.stringify(this.transactions));
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 表单提交事件
        // 在 setupEventListeners 中找到这一行
        document.getElementById('transaction-form').addEventListener('submit', async (e) => { // 加上 async
            e.preventDefault();
            await this.addTransaction(); // 加上 await
        });
        
        // 重置表单按钮
        document.getElementById('reset-form').addEventListener('click', () => {
            document.getElementById('transaction-form').reset();
            this.setupFormDefaults();
        });
        
        // 搜索功能
        document.getElementById('search').addEventListener('input', () => {
            this.renderTransactions();
        });
        
        // 筛选功能
        document.getElementById('filter-direction').addEventListener('change', () => {
            this.renderTransactions();
        });
        // 周期筛选
        document.getElementById('filter-cycle').addEventListener('change', () => {
            this.renderTransactions();
        });
        // 类型筛选
        document.getElementById('filter-type').addEventListener('change', () => {
            this.renderTransactions();
        });
        // 日期范围筛选
        document.getElementById('date-from').addEventListener('change', () => {
            this.renderTransactions();
        });
        
        document.getElementById('date-to').addEventListener('change', () => {
            this.renderTransactions();
        });
        
        // 添加清除日期按钮事件
        this.addClearDateButtons();
        
        // 添加快速筛选按钮
        this.addQuickFilterButtons();
        
        // 导出数据按钮
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });
        
        // 导入数据按钮
        document.getElementById('import-data').addEventListener('click', () => {
            this.showImportModal();
        });
        
        // 清空所有记录按钮
        document.getElementById('clear-all').addEventListener('click', () => {
            if (this.transactions.length === 0) {
                this.showMessage('当前没有交易记录可清除。', 'info');
                return;
            }

            if (confirm('确定要清空所有交易记录吗？此操作不可撤销。')) {
                this.clearAllTransactions();
            }
        });

        // AI复盘评测按钮（高级功能引导）
        document.getElementById('ai-review').addEventListener('click', () => {
            alert("该功能为高级版功能 🚀\n\n👉 可自动分析你的交易问题\n👉 给出改进建议\n\n添加联系：QQ:983546231,WeChat:dobby2580 获取");
        });
        
        // 导入模态框事件
        document.getElementById('confirm-import').addEventListener('click', () => {
            this.importData();
        });
        
        document.getElementById('cancel-import').addEventListener('click', () => {
            this.hideImportModal();
        });
        
        // 详情模态框关闭事件
        document.getElementById('close-detail').addEventListener('click', () => {
            this.hideDetailModal();
        });
        
        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // 文件上传预览
        document.getElementById('screenshot').addEventListener('change', (e) => {
            this.previewImage(e.target);
        });
        
        // 添加实际风险建议按钮
        this.addActualRiskSuggestions();
    }
    
    // 添加实际风险建议功能
    addActualRiskSuggestions() {
        const actualRiskInput = document.getElementById('actual-risk');
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'actual-risk-suggestions';
        suggestionsContainer.innerHTML = `
            <div class="suggestion-title">风险建议:</div>
            <div class="suggestion-buttons">
                <button type="button" class="suggestion-btn" data-percent="50">50%（半仓风险）</button>
                <button type="button" class="suggestion-btn" data-percent="100">100%（全仓风险）</button>
                <button type="button" class="suggestion-btn" data-percent="25">25%（四分之一）</button>
            </div>
        `;
        
        // 插入到实际风险输入框后面
        actualRiskInput.parentNode.parentNode.appendChild(suggestionsContainer);
        
        // 为建议按钮添加事件
        suggestionsContainer.querySelectorAll('.suggestion-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const percent = parseFloat(e.target.getAttribute('data-percent'));
                const initialRisk = this.calculateRiskValue();
                const suggestedRisk = (initialRisk * percent / 100).toFixed(2);
                
                actualRiskInput.value = suggestedRisk;
                this.calculateActualRiskPercent();
            });
        });
    }
    
    // 添加清除日期按钮
    addClearDateButtons() {
        // 为日期输入框添加清除按钮
        const dateInputs = ['date-from', 'date-to'];
        
        dateInputs.forEach(id => {
            const input = document.getElementById(id);
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'clear-date-btn';
            clearBtn.innerHTML = '<i class="fas fa-times"></i>';
            clearBtn.title = '清除日期';
            
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                input.value = '';
                this.renderTransactions();
            });
            
            // 将清除按钮添加到输入框后面
            input.parentNode.insertBefore(clearBtn, input.nextSibling);
        });
    }
    
    // 添加快速筛选按钮
    addQuickFilterButtons() {
        // 创建快速筛选按钮容器
        const quickFilterContainer = document.createElement('div');
        quickFilterContainer.className = 'quick-filter-buttons';
        
        // 定义快速筛选选项
        const quickFilters = [
            { label: '今天', days: 0 },
            { label: '最近7天', days: 7 },
            { label: '最近30天', days: 30 },
            { label: '本月', special: 'thisMonth' },
            { label: '上月', special: 'lastMonth' }
        ];
        
        // 创建按钮
        quickFilters.forEach(filter => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-filter-btn';
            button.textContent = filter.label;
            
            button.addEventListener('click', () => {
                this.applyQuickFilter(filter);
                
                // 更新按钮状态
                document.querySelectorAll('.quick-filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            });
            
            quickFilterContainer.appendChild(button);
        });
        
        // 将快速筛选按钮添加到搜索区域
        const searchFilter = document.querySelector('.search-filter');
        searchFilter.parentNode.insertBefore(quickFilterContainer, searchFilter.nextSibling);
    }
    
    // 应用快速筛选
    applyQuickFilter(filter) {
        const today = new Date();
        let dateFrom, dateTo;
        
        if (filter.special === 'thisMonth') {
            dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
            dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (filter.special === 'lastMonth') {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            dateFrom = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            dateTo = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        } else {
            dateFrom = new Date();
            dateFrom.setDate(today.getDate() - filter.days);
            dateTo = today;
        }
        
        // 设置日期输入框的值
        document.getElementById('date-from').value = dateFrom.toISOString().split('T')[0];
        document.getElementById('date-to').value = dateTo.toISOString().split('T')[0];
        
        // 重新渲染交易记录
        this.renderTransactions();
    }
    
    // 添加新交易
   async addTransaction() {
        // 获取表单数据
        const tradeCycle = document.getElementById('trade-cycle').value;
        const tradeType = document.getElementById('trade-type').value;
        const tradeBackground = document.getElementById('trade-background').value.trim();
        const tradeDirection = document.getElementById('trade-direction').value;
        const tradeSymbol = document.getElementById('trade-symbol').value;
        const standardLotValue = parseFloat(document.getElementById('standard-lot-value').value);
        const entryTime = document.getElementById('entry-time').value;
        const positionSize = parseFloat(document.getElementById('position-size').value);
        const entryPrice = parseFloat(document.getElementById('entry-price').value);
        const entrySignal = document.getElementById('entry-signal').value;
        const entryReason = document.getElementById('entry-reason').value.trim();
        const initialStop = parseFloat(document.getElementById('initial-stop').value);
        const initialTarget = parseFloat(document.getElementById('initial-target').value);
        const actualRisk = parseFloat(document.getElementById('actual-risk').value) || 0; // 手动输入
        const exitTime = document.getElementById('exit-time').value;
        const exitPrice = parseFloat(document.getElementById('exit-price').value) || null;
        const exitReason = document.getElementById('exit-reason').value;
        const notes = document.getElementById('notes').value.trim();
        
        // 获取计算值
        const stopPips = parseFloat(document.getElementById('stop-pips').textContent) || 0;
        const targetPips = parseFloat(document.getElementById('target-pips').textContent) || 0;
        const riskPips = parseFloat(document.getElementById('risk-pips').textContent) || 0;
        const perPipValue = parseFloat(document.getElementById('per-pip-value').textContent.replace('¥', '')) || 0;
        const initialRiskValue = this.calculateRiskValue(); // 初始风险价值
        const actualRiskPercent = this.calculateActualRiskPercent(); // 实际风险百分比
        
        // 获取风险回报比
        const riskReward = document.getElementById('risk-reward').value;
        
        // 处理交易截图（前端模拟，实际需要后端支持）
        const screenshotFile = document.getElementById('screenshot').files[0];
        let screenshotData = null;

        if (screenshotFile) {
            // 使用 Promise 读取 Base64
            const base64String = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(screenshotFile);
            });

            screenshotData = {
                fileName: screenshotFile.name,
                fileSize: screenshotFile.size,
                fileType: screenshotFile.type,
                previewUrl: base64String // 这里存储的是永久的 Base64 数据
            };
        }
        
        // 计算实际盈亏和风险回报比
        let actualProfitLoss = 0;
        let actualRiskReward = '';
        
        if (exitPrice) {
            // 修正计算：使用每点价值计算盈亏
            const priceDiff = Math.abs(exitPrice - entryPrice);
            const perPipValueCurrent = positionSize * standardLotValue;
            
            if (tradeDirection === '多') {
                actualProfitLoss = (exitPrice - entryPrice) * perPipValueCurrent;
            } else { // 空
                actualProfitLoss = (entryPrice - exitPrice) * perPipValueCurrent;
            }
            
            // 计算实际风险回报比（使用实际风险）
            if (actualRisk > 0 && actualProfitLoss !== 0) {
                const ratio = Math.abs(actualProfitLoss / actualRisk).toFixed(2);
                actualRiskReward = actualProfitLoss >= 0 ? `1:${ratio}` : `-1:${ratio}`;
            }
        }
        
        // 创建交易对象
        const transaction = {
            id: Date.now(), // 使用时间戳作为唯一ID
            tradeCycle,
            tradeType,
            tradeBackground,
            tradeDirection,
            tradeSymbol,
            standardLotValue,
            entryTime,
            positionSize,
            entryPrice,
            entrySignal,
            entryReason,
            initialStop,
            initialTarget,
            stopPips,
            targetPips,
            riskPips,
            perPipValue,
            initialRiskValue, // 初始风险价值
            actualRisk, // 手动输入的实际风险
            actualRiskPercent, // 实际风险百分比
            riskReward,
            exitTime: exitTime || null,
            exitPrice,
            exitReason: exitReason || null,
            actualProfitLoss,
            actualRiskReward,
            screenshot: screenshotData,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // 添加到交易记录数组
        this.transactions.unshift(transaction); // 添加到开头，使最新记录显示在最上面
        
        // 保存到本地存储
        this.saveTransactions();
        
        // 重新渲染交易列表
        this.renderTransactions();
        
        // 更新统计信息
        this.updateStats();
        
        // 重置表单
        document.getElementById('transaction-form').reset();
        this.setupFormDefaults();
        
        // 清除文件预览
        document.getElementById('file-preview').innerHTML = '';
        
        // 显示成功消息
        this.showMessage('交易记录添加成功！', 'success');

        // 更新图表
        this.renderCharts();

        // 转化钩子：保存成功后引导私域
        setTimeout(() => {
            alert("记录已保存 ✅\n\n👉 想知道你的这笔交易是否符合专业交易逻辑？\n联系：QQ:983546231,WeChat:dobby2580\n解锁【AI评估】");
        }, 500);
    }
    
    // 预览上传的图片
    previewImage(input) {
        const preview = document.getElementById('file-preview');
        
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                preview.innerHTML = `
                    <div class="image-preview">
                        <p>已选择文件: ${file.name} (${(file.size / 1024).toFixed(2)} KB)</p>
                        <img src="${e.target.result}" alt="预览" style="max-width: 200px; max-height: 150px; margin-top: 10px; border-radius: 4px;">
                    </div>
                `;
            };
            
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }
    
    // 删除交易记录
    deleteTransaction(id) {
        // 从数组中移除指定ID的交易
        this.transactions = this.transactions.filter(transaction => transaction.id !== id);
        
        // 保存到本地存储
        this.saveTransactions();
        
        // 重新渲染交易列表
        this.renderTransactions();
        
        // 更新统计信息
        this.updateStats();
        
        // 显示消息
        this.showMessage('交易记录已删除。', 'info');

        // 更新图表
        this.renderCharts();
    }

    // 清空所有交易记录
    clearAllTransactions() {
        this.transactions = [];
        this.saveTransactions();
        this.renderTransactions();
        this.updateStats();
        this.showMessage('所有交易记录已清空。', 'info');

        // 更新图表
        this.renderCharts();
    }
    
    // 排序交易记录
    sortTransactions(field) {
        // 如果点击的是当前排序字段，则切换排序方向
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // 否则设置新的排序字段，默认降序
            this.currentSort.field = field;
            this.currentSort.direction = 'desc';
        }
        
        // 根据字段和方向排序
        this.transactions.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];
            
            // 处理特殊字段
            if (field === 'entryTime' || field === 'exitTime') {
                // 将时间字符串转换为时间戳进行比较
                aValue = aValue ? new Date(aValue.replace(' ', 'T')).getTime() : 0;
                bValue = bValue ? new Date(bValue.replace(' ', 'T')).getTime() : 0;
            }
            
            // 处理数值字段
            if (['positionSize', 'entryPrice', 'initialStop', 'initialTarget', 
                 'exitPrice', 'actualProfitLoss', 'actualRisk', 'standardLotValue',
                 'perPipValue', 'initialRiskValue', 'actualRiskPercent'].includes(field)) {
                aValue = aValue || 0;
                bValue = bValue || 0;
            }
            
            // 处理字符串字段（交易品种、周期、方向等）
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            // 排序比较
            let result = 0;
            if (aValue < bValue) result = -1;
            if (aValue > bValue) result = 1;
            
            // 根据排序方向调整结果
            return this.currentSort.direction === 'asc' ? result : -result;
        });
        
        // 重新渲染交易列表
        this.renderTransactions();
    }
    
    // 渲染交易列表
    renderTransactions() {
        const tbody = document.getElementById('transactions-body');
        const searchTerm = document.getElementById('search').value.toLowerCase();
        const filterDirection = document.getElementById('filter-direction').value;
        const filterCycle = document.getElementById('filter-cycle').value;
        const filterType = document.getElementById('filter-type').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        
        // 清空表格内容
        tbody.innerHTML = '';
        
        // 筛选交易记录
        let filteredTransactions = this.transactions.filter(transaction => {
            // 关键词搜索
            const matchesSearch = 
                transaction.tradeBackground.toLowerCase().includes(searchTerm) || 
                (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm)) ||
                transaction.tradeSymbol.toLowerCase().includes(searchTerm);
            
            // 方向筛选
            const matchesDirection = !filterDirection || transaction.tradeDirection === filterDirection;
            
            // 周期筛选
            const matchesCycle = !filterCycle || transaction.tradeCycle === filterCycle;

            // 类型筛选
            const matchesType = !filterType || transaction.tradeType === filterType;
            
            // 日期范围筛选
            let matchesDate = true;
            if (dateFrom || dateTo) {
                const entryDate = transaction.entryTime.split(' ')[0]; // 获取日期部分
                
                if (dateFrom && entryDate < dateFrom) {
                    matchesDate = false;
                }
                
                if (dateTo && entryDate > dateTo) {
                    matchesDate = false;
                }
            }
            
            return matchesSearch && matchesDirection && matchesCycle && matchesDate && matchesType;
        });
        
        // 如果没有任何交易记录，显示空状态
        if (filteredTransactions.length === 0) {
            tbody.innerHTML = `
                <tr id="no-transactions">
                    <td colspan="11" class="empty-message">
                        <i class="fas fa-info-circle"></i> 
                        ${this.transactions.length === 0 ? 
                            '暂无交易记录，请添加您的第一笔交易' : 
                            '没有找到匹配的交易记录'}
                    </td>
                </tr>
            `;
            return;
        }
        
        // 应用当前排序
        if (this.currentSort.field) {
            filteredTransactions = [...filteredTransactions]; // 创建副本
            filteredTransactions.sort((a, b) => {
                let aValue = a[this.currentSort.field];
                let bValue = b[this.currentSort.field];
                
                // 处理特殊字段
                if (this.currentSort.field === 'entryTime' || this.currentSort.field === 'exitTime') {
                    aValue = aValue ? new Date(aValue.replace(' ', 'T')).getTime() : 0;
                    bValue = bValue ? new Date(bValue.replace(' ', 'T')).getTime() : 0;
                }
                
                // 处理数值字段
                if (['positionSize', 'entryPrice', 'initialStop', 'initialTarget', 
                     'exitPrice', 'actualProfitLoss', 'actualRisk', 'standardLotValue',
                     'perPipValue', 'initialRiskValue', 'actualRiskPercent'].includes(this.currentSort.field)) {
                    aValue = aValue || 0;
                    bValue = bValue || 0;
                }
                
                // 处理字符串字段
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }
                
                let result = 0;
                if (aValue < bValue) result = -1;
                if (aValue > bValue) result = 1;
                
                return this.currentSort.direction === 'asc' ? result : -result;
            });
        }
        
        // 渲染交易记录行
        filteredTransactions.forEach(transaction => {
            const entryTime = transaction.entryTime.split(' ')[0]; // 只显示日期
            const profitLoss = transaction.actualProfitLoss || 0;
            const profitClass = profitLoss >= 0 ? 'profit' : 'loss';
            const directionClass = transaction.tradeDirection === '多' ? 'direction-long' : 'direction-short';
            
            // 为不同交易品种添加不同颜色类
            const symbolClass = this.getSymbolClass(transaction.tradeSymbol);
            
            // 计算实际风险百分比提示
            const riskPercent = transaction.actualRiskPercent || 0;
            let riskPercentText = '';
            if (riskPercent > 0) {
                riskPercentText = `<span class="risk-percent">(${riskPercent.toFixed(1)}%)</span>`;
            }
            
            const row = document.createElement('tr');
            row.setAttribute('data-id', transaction.id);
            row.innerHTML = `
                <td>${entryTime}</td>
                <td>${transaction.tradeCycle}</td>
                <td>${transaction.tradeType}</td>
                <td class="${directionClass}">${transaction.tradeDirection === '多' ? '多头' : '空头'}</td>
                <td class="symbol-cell ${symbolClass}">${transaction.tradeSymbol}</td>
                <td>${transaction.positionSize.toFixed(2)}</td>
                <td>${transaction.entryPrice.toFixed(4)}</td>
                <td>${transaction.initialStop.toFixed(4)}</td>
                <td>${transaction.initialTarget.toFixed(4)}</td>
                <td>${transaction.exitPrice ? transaction.exitPrice.toFixed(4) : '--'}</td>
                <td class="${profitClass}">
                    ${profitLoss !== 0 ? '¥' + profitLoss.toFixed(2) : '--'}
                    ${riskPercentText}
                </td>
                <td>
                    <button class="action-btn view-detail-btn" data-id="${transaction.id}">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="action-btn delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // 为查看按钮添加事件监听器
        document.querySelectorAll('.view-detail-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                this.showTransactionDetail(id);
            });
        });
        
        // 为删除按钮添加事件监听器
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                if (confirm('确定要删除这条交易记录吗？')) {
                    this.deleteTransaction(id);
                }
            });
        });
        
        // 为行添加点击事件
        document.querySelectorAll('tbody tr[data-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const id = parseInt(row.getAttribute('data-id'));
                    this.showTransactionDetail(id);
                }
            });
        });
    }
    
    // 获取交易品种对应的CSS类
    getSymbolClass(symbol) {
        if (symbol.includes('XAU')) return 'symbol-gold';
        if (['EURUSD', 'GBPUSD', 'USDJPY'].includes(symbol)) return 'symbol-forex';
        if (symbol.includes('US30')) return 'symbol-index';
        if (['BTC', 'ETH'].some(crypto => symbol.includes(crypto))) return 'symbol-crypto';
        if (['AAPL', 'TSLA'].some(stock => symbol.includes(stock))) return 'symbol-stock';
        return '';
    }
    
    // 显示交易详情
    showTransactionDetail(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;
        
        this.currentDetailId = id;
        
        // 更新详情模态框标题
        document.getElementById('detail-title').textContent = 
            `${transaction.tradeSymbol} - ${transaction.tradeCycle} - ${transaction.tradeDirection === '多' ? '多头' : '空头'}交易`;
        
        // 构建详情内容
        const detailContent = document.getElementById('detail-content');
        
        // 格式化时间
        const formatTime = (timeStr) => {
            if (!timeStr) return '--';
            return timeStr.replace(' ', ' ');
        };
        
        // 计算持仓时间
        const calculateDuration = (entryTime, exitTime) => {
            if (!entryTime || !exitTime) return '--';
            
            const entry = new Date(entryTime.replace(' ', 'T'));
            const exit = new Date(exitTime.replace(' ', 'T'));
            const diffMs = exit - entry;
            
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            if (days > 0) {
                return `${days}天${hours}小时`;
            } else {
                return `${hours}小时`;
            }
        };
        
        // 风险百分比颜色类
        const getRiskPercentClass = (percent) => {
            if (percent <= 50) return 'positive';
            if (percent <= 100) return '';
            return 'negative';
        };
        
        // 构建HTML
        detailContent.innerHTML = `
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> 基本信息</h4>
                <div class="detail-row">
                    <div class="detail-label">交易品种：</div>
                    <div class="detail-value symbol-cell ${this.getSymbolClass(transaction.tradeSymbol)}">
                        ${transaction.tradeSymbol} ${this.symbolPresets[transaction.tradeSymbol]?.name || ''}
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">交易周期：</div>
                    <div class="detail-value">${transaction.tradeCycle}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">交易类型：</div>
                    <div class="detail-value">${transaction.tradeType}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">交易方向：</div>
                    <div class="detail-value ${transaction.tradeDirection === '多' ? 'direction-long' : 'direction-short'}">
                        ${transaction.tradeDirection === '多' ? '多头' : '空头'}
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">标准手价格波动：</div>
                    <div class="detail-value">¥${transaction.standardLotValue?.toFixed(2) || '100.00'} / 点</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">交易背景：</div>
                    <div class="detail-value">${transaction.tradeBackground}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-door-open"></i> 开仓信息</h4>
                <div class="detail-row">
                    <div class="detail-label">开仓时间：</div>
                    <div class="detail-value">${formatTime(transaction.entryTime)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">手数/数量：</div>
                    <div class="detail-value">${transaction.positionSize.toFixed(2)} (${(transaction.positionSize).toFixed(2)}标准手)</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">每点价值：</div>
                    <div class="detail-value">¥${transaction.perPipValue?.toFixed(2) || '0.00'} / 点</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">开仓价格：</div>
                    <div class="detail-value">${transaction.entryPrice.toFixed(4)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">开仓方式：</div>
                    <div class="detail-value">${transaction.entrySignal}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">开仓理由：</div>
                    <div class="detail-value">${transaction.entryReason}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-shield-alt"></i> 风险管理</h4>
                <div class="detail-row">
                    <div class="detail-label">初始止损：</div>
                    <div class="detail-value">${transaction.initialStop.toFixed(4)} (${transaction.stopPips?.toFixed(4) || '0.0000'}点)</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">初始目标：</div>
                    <div class="detail-value">${transaction.initialTarget.toFixed(4)} (${transaction.targetPips?.toFixed(4) || '0.0000'}点)</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">初始风险价值：</div>
                    <div class="detail-value">¥${transaction.initialRiskValue?.toFixed(2) || '0.00'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">实际风险：</div>
                    <div class="detail-value">
                        ¥${transaction.actualRisk?.toFixed(2) || '0.00'}
                        <span class="${getRiskPercentClass(transaction.actualRiskPercent || 0)}">
                            (${transaction.actualRiskPercent?.toFixed(1) || '0'}% 的初始风险)
                        </span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">风险点数：</div>
                    <div class="detail-value">${transaction.riskPips?.toFixed(4) || '0.0000'}点</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">风险回报比：</div>
                    <div class="detail-value">${transaction.riskReward || '--'}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-door-closed"></i> 平仓信息</h4>
                <div class="detail-row">
                    <div class="detail-label">平仓时间：</div>
                    <div class="detail-value">${formatTime(transaction.exitTime)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">持仓时间：</div>
                    <div class="detail-value">${calculateDuration(transaction.entryTime, transaction.exitTime)}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">平仓价格：</div>
                    <div class="detail-value">${transaction.exitPrice ? transaction.exitPrice.toFixed(4) : '--'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">实际盈亏：</div>
                    <div class="detail-value ${transaction.actualProfitLoss >= 0 ? 'profit' : 'loss'}">
                        ${transaction.actualProfitLoss ? '¥' + transaction.actualProfitLoss.toFixed(2) : '--'}
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">实际风险回报比：</div>
                    <div class="detail-value">${transaction.actualRiskReward || '--'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">平仓理由：</div>
                    <div class="detail-value">${transaction.exitReason || '--'}</div>
                </div>
            </div>
            
            ${transaction.screenshot ? `
            <div class="detail-section">
                <h4><i class="fas fa-image"></i> 交易截图</h4>
                <img src="${transaction.screenshot.previewUrl}" 
                     alt="交易截图" 
                     class="screenshot-preview"
                     onclick="this.classList.toggle('fullscreen')">
                <p class="screenshot-info">${transaction.screenshot.fileName} (${(transaction.screenshot.fileSize / 1024).toFixed(2)} KB)</p>
            </div>
            ` : ''}
            
            ${transaction.notes ? `
            <div class="detail-section">
                <h4><i class="fas fa-sticky-note"></i> 备注</h4>
                <div class="detail-value">${transaction.notes}</div>
            </div>
            ` : ''}
            
            <div class="risk-explanation">
                <p><i class="fas fa-info-circle"></i> 
                实际风险说明：持仓过程中遇到的最大风险（例如：移动止损后、提前减仓等情况），通常小于等于初始风险。
                初始风险是基于止损价计算的潜在最大损失。</p>
            </div>
        `;
        
        // 显示详情模态框
        document.getElementById('detail-modal').style.display = 'flex';
        
        // 添加图片全屏功能
        const screenshotImg = detailContent.querySelector('.screenshot-preview');
        if (screenshotImg) {
            screenshotImg.addEventListener('click', function() {
                this.classList.toggle('fullscreen');
            });
        }
    }
    
    // 隐藏详情模态框
    hideDetailModal() {
        document.getElementById('detail-modal').style.display = 'none';
        this.currentDetailId = null;
    }
    
    // 更新统计信息
    updateStats() {
        const totalCount = this.transactions.length;
        document.getElementById('total-count').textContent = totalCount;
        
        // 计算胜率和总盈亏
        let winCount = 0;
        let totalProfitLoss = 0;
        let totalRiskReward = 0;
        let closedTrades = 0;
        
        // 计算实际风险控制统计
        let lowRiskTrades = 0; // 实际风险 <= 50% 初始风险
        let moderateRiskTrades = 0; // 50% < 实际风险 <= 100% 初始风险
        let highRiskTrades = 0; // 实际风险 > 100% 初始风险
        
        this.transactions.forEach(t => {
            if (t.exitPrice) {
                closedTrades++;
                if (t.actualProfitLoss > 0) winCount++;
                totalProfitLoss += t.actualProfitLoss;
                
                // 计算平均风险回报比
                if (t.actualRiskReward) {
                    const ratioMatch = t.actualRiskReward.match(/[-]?1:([\d.]+)/);
                    if (ratioMatch) {
                        totalRiskReward += parseFloat(ratioMatch[1]);
                    }
                }
                
                // 统计实际风险控制
                if (t.actualRiskPercent) {
                    if (t.actualRiskPercent <= 50) {
                        lowRiskTrades++;
                    } else if (t.actualRiskPercent <= 100) {
                        moderateRiskTrades++;
                    } else {
                        highRiskTrades++;
                    }
                }
            }
        });
        
        // 更新胜率
        const winRate = closedTrades > 0 ? ((winCount / closedTrades) * 100).toFixed(1) : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        
        // 更新总盈亏
        const totalPlElement = document.getElementById('total-pl');
        totalPlElement.textContent = `¥${totalProfitLoss.toFixed(2)}`;
        totalPlElement.className = totalProfitLoss >= 0 ? 'stat-value positive' : 'stat-value negative';
        
        // 更新平均风险回报比
        const avgR = closedTrades > 0 ? (totalRiskReward / closedTrades).toFixed(2) : 0;
        document.getElementById('avg-r').textContent = avgR;
        
        // 可以添加实际风险控制统计显示
        if (closedTrades > 0) {
            const riskStats = document.createElement('div');
            riskStats.className = 'risk-stats-summary';
            riskStats.innerHTML = `
                <div class="risk-stat-item">
                    <span class="risk-stat-label">低风险交易:</span>
                    <span class="risk-stat-value">${lowRiskTrades} (${((lowRiskTrades/closedTrades)*100).toFixed(1)}%)</span>
                </div>
                <div class="risk-stat-item">
                    <span class="risk-stat-label">中等风险:</span>
                    <span class="risk-stat-value">${moderateRiskTrades} (${((moderateRiskTrades/closedTrades)*100).toFixed(1)}%)</span>
                </div>
                <div class="risk-stat-item">
                    <span class="risk-stat-label">高风险:</span>
                    <span class="risk-stat-value">${highRiskTrades} (${((highRiskTrades/closedTrades)*100).toFixed(1)}%)</span>
                </div>
            `;
            
            // 添加到统计区域（如果需要）
            // document.querySelector('.stats-summary').appendChild(riskStats);
        }
    }
    
    // 导出数据为JSON文件
    exportData() {
        if (this.transactions.length === 0) {
            this.showMessage('没有交易记录可导出。', 'info');
            return;
        }
        
        // 创建数据对象
        const exportData = {
            exportDate: new Date().toISOString(),
            transactionCount: this.transactions.length,
            transactions: this.transactions
        };
        
        // 转换为JSON字符串
        const dataStr = JSON.stringify(exportData, null, 2);
        
        // 创建下载链接
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // 创建下载链接并触发点击
        const link = document.createElement('a');
        link.href = url;
        link.download = `专业交易记录_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        URL.revokeObjectURL(url);
        
        // 显示消息
        this.showMessage('数据导出成功！', 'success');
    }
    
    // 显示导入模态框
    showImportModal() {
        document.getElementById('import-modal').style.display = 'flex';
        document.getElementById('import-file').value = '';
    }
    
    // 隐藏导入模态框
    hideImportModal() {
        document.getElementById('import-modal').style.display = 'none';
    }
    
    // 导入数据
    importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showMessage('请选择要导入的文件。', 'warning');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!importedData.transactions || !Array.isArray(importedData.transactions)) {
                    throw new Error('文件格式不正确');
                }
                
                // 确认是否覆盖
                if (this.transactions.length > 0 && 
                    !confirm('导入数据将覆盖现有交易记录，确定要继续吗？')) {
                    return;
                }
                
                // 导入数据
                this.transactions = importedData.transactions;
                this.saveTransactions();
                this.renderTransactions();
                this.updateStats();

                // 更新图表
                this.renderCharts();

                // 关闭模态框
                this.hideImportModal();

                // 显示消息
                this.showMessage(`成功导入 ${this.transactions.length} 条交易记录。`, 'success');
                
            } catch (error) {
                console.error('导入失败:', error);
                this.showMessage('导入失败：文件格式不正确或已损坏。', 'error');
            }
        };
        
        reader.onerror = () => {
            this.showMessage('读取文件时发生错误。', 'error');
        };
        
        reader.readAsText(file);
    }
    
    // 显示消息
    showMessage(message, type) {
        // 移除现有消息
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        messageEl.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // 添加样式
        messageEl.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 400px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        
        // 根据类型设置背景色
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };
        
        messageEl.style.background = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
        
        // 添加CSS动画
        if (!document.querySelector('#message-animations')) {
            const style = document.createElement('style');
            style.id = 'message-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ProfessionalTradingTracker();
});