-- AlterTable: courier payment config per contract (seller-set).
-- paymentType: SALARY (fixed monthly), PER_ORDER (so'm per delivery), PERCENT (% of delivery fee).
-- paymentValue: so'm for SALARY/PER_ORDER, percent for PERCENT. Default keeps the
-- prior behaviour (80% of the delivery fee) so existing contracts are unchanged.
ALTER TABLE `CourierContract`
    ADD COLUMN `paymentType` ENUM('SALARY', 'PER_ORDER', 'PERCENT') NOT NULL DEFAULT 'PERCENT',
    ADD COLUMN `paymentValue` DECIMAL(12, 2) NOT NULL DEFAULT 80.00;
