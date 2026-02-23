import { App, Modal, ButtonComponent, Setting } from 'obsidian';

export class EnumClearConfirmationModal extends Modal {
    private onConfirm: (skipFutureWarnings: boolean) => void;
    private onCancel: () => void;
    private columnName: string;
    private dataCount: number;
    private skipFutureWarnings = false;

    constructor(
        app: App, 
        columnName: string, 
        dataCount: number,
        onConfirm: (skipFutureWarnings: boolean) => void,
        onCancel: () => void
    ) {
        super(app);
        this.columnName = columnName;
        this.dataCount = dataCount;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
    }

    onOpen() {
        const { contentEl } = this;
        this.containerEl.find('.modal-close-button').remove();
        this.setTitle('Change Type to Enum?');
        contentEl.addClass("tp-modal-content");
        contentEl.addClass("confirmation-modal-subcontent");

        const s = new Setting(contentEl)
            .setName("Converting Column")
            .setDesc('Note: You will need to undo multiple times to revert changes.');
            s.nameEl.innerHTML = `Converting Column <b>${this.columnName}</b> will clear its <b>${this.dataCount}</b> existing cell${this.dataCount !== 1 ? 's' : ''} of data.`;
        new Setting(contentEl)
            .setName('Skip this warning for this session')
            .addToggle(toggle => {
                toggle.setValue(this.skipFutureWarnings);
                toggle.onChange(value => {
                    this.skipFutureWarnings = value;
                });
            });

        const buttonContainer = contentEl.createDiv({ 
            cls: 'tp-confirmation-buttons'
        });
        
        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.onCancel();
                this.close();
            });

        new ButtonComponent(buttonContainer)
            .setButtonText('Convert')
            .setCta()
            .onClick(() => {
                this.onConfirm(this.skipFutureWarnings);
                this.close();
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
