class Plugin {
    constructor(workspace) {
        this.workspace = workspace;
    }

    async onload() {
        console.log("Time & Scheduler Plugin v1.1.0 Loaded!");
        this.registerBlocks();
    }

    async onunload() {
        console.log("Time & Scheduler Plugin Unloaded.");
        this.unregisterBlocks();
    }

    registerBlocks() {
        if (typeof Blockly === 'undefined') {
            console.warn("Blockly is not available.");
            return;
        }

        // 1. 定期実行 (Cron Event) - ハットブロック
        Blockly.Blocks['scheduler_cron'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField("⏰ イベント: ")
                    .appendField(new Blockly.FieldDropdown([
                        ["毎日", "DAILY"],
                        ["毎時", "HOURLY"],
                        ["1分おき", "EVERY_MINUTE"],
                        ["5分おき", "EVERY_5_MINUTES"],
                        ["30分おき", "EVERY_30_MINUTES"]
                    ]), "INTERVAL")
                    .appendField("に実行する");
                this.appendStatementInput("DO")
                    .appendField("実行内容");
                this.setInputsInline(true);
                this.setNextStatement(false);
                this.setPreviousStatement(false); // ハットブロックにするため false
                this.setColour(20); // イベントカラー（オレンジ系）
                this.setTooltip("指定した間隔で繰り返し処理を開始します。");
            }
        };

        // 2. 指定時間 (At Time Event) - ハットブロック
        Blockly.Blocks['scheduler_at_time'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField("📅 イベント: ")
                    .appendField(new Blockly.FieldTextInput("12:00"), "TIME")
                    .appendField("になったら実行");
                this.appendStatementInput("DO")
                    .appendField("実行内容");
                this.setInputsInline(true);
                this.setNextStatement(false);
                this.setPreviousStatement(false); // ハットブロックにするため false
                this.setColour(20); // イベントカラー
                this.setTooltip("指定した時刻に処理を開始します。");
            }
        };

        // 3. 待機 (Wait) - ステートメントブロック
        Blockly.Blocks['scheduler_wait'] = {
            init: function() {
                this.appendDummyInput()
                    .appendField("⏳ 待機:")
                    .appendField(new Blockly.FieldNumber(1, 0), "VALUE")
                    .appendField(new Blockly.FieldDropdown([
                        ["秒", "SECONDS"],
                        ["分", "MINUTES"]
                    ]), "UNIT")
                    .appendField("待ってから次へ");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(230);
                this.setTooltip("指定した時間だけ処理を一時停止します。");
            }
        };

        // Pythonコード生成
        Blockly.Python['scheduler_cron'] = function(block) {
            const interval = block.getFieldValue('INTERVAL');
            const branch = Blockly.Python.statementToCode(block, 'DO');
            return `@tasks.loop(minutes=...)\nasync def scheduled_task():\n${branch || '  pass'}\n`;
        };

        Blockly.Python['scheduler_at_time'] = function(block) {
            const time = block.getFieldValue('TIME');
            const branch = Blockly.Python.statementToCode(block, 'DO');
            return `# Event at ${time}\n@tasks.loop(seconds=60)\nasync def check_time():\n  if datetime.now().strftime("%H:%M") == "${time}":\n${branch || '    pass'}\n`;
        };

        Blockly.Python['scheduler_wait'] = function(block) {
            const value = block.getFieldValue('VALUE');
            const unit = block.getFieldValue('UNIT');
            const seconds = unit === 'MINUTES' ? value * 60 : value;
            return `await asyncio.sleep(${seconds})\n`;
        };

        this.updateToolbox();
    }

    updateToolbox() {
        const toolbox = document.getElementById('toolbox');
        if (!toolbox) return;

        let category = toolbox.querySelector('category[name="時間・スケジュール"]');
        if (!category) {
            category = document.createElement('category');
            category.setAttribute('name', '時間・スケジュール');
            category.setAttribute('data-icon', '⏰');
            category.setAttribute('colour', '#5C6BC0');
            toolbox.appendChild(category);
        }

        category.innerHTML = `
            <block type="scheduler_cron"></block>
            <block type="scheduler_at_time"></block>
            <block type="scheduler_wait"></block>
        `;

        if (this.workspace && this.workspace.updateToolbox) {
            this.workspace.updateToolbox(toolbox);
        }
    }

    unregisterBlocks() {
        const toolbox = document.getElementById('toolbox');
        if (toolbox) {
            const category = toolbox.querySelector('category[name="時間・スケジュール"]');
            if (category) {
                category.remove();
                if (this.workspace && this.workspace.updateToolbox) {
                    this.workspace.updateToolbox(toolbox);
                }
            }
        }
    }
}
