import { LedgerEntryStatus, LedgerEntryType } from 'src/types';
import { BeforeInsert, Column, Entity, ManyToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Ledger {
    @PrimaryColumn({type: 'varchar', length: 100 })
    id: string;

    @Column({ type: 'varchar', length: 50, nullable: false})
    userId: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: false})
    amount: number;

    @Column({ type: 'varchar', length: 20, nullable: false})
    theme: string;
    
    @Column({ 
        enum: LedgerEntryType,
        default: LedgerEntryType.DEPOSIT
    })
    type: LedgerEntryType;

    @Column({
        enum: LedgerEntryStatus,
        default: LedgerEntryStatus.PENDING
    })
    status: LedgerEntryStatus

    @Column("text", {array:true})
    approvals?: string[];

    @Column("text", {array: true})
    rejections?: string[]

    @Column()
    documentURL: string

    @Column({ type: 'text', nullable: true})
    description: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt: Date

    @BeforeInsert()
    generateId() {
        const timestamp = Date.now();
        this.id = `LEDGER_${timestamp}_${this.userId}`;
    }
}