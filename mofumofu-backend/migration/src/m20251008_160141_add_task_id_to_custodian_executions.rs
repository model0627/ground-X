use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(CustodianExecutions::Table)
                    .add_column(
                        ColumnDef::new(CustodianExecutions::TaskId)
                            .string()
                            .null()
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(CustodianExecutions::Table)
                    .drop_column(CustodianExecutions::TaskId)
                    .to_owned(),
            )
            .await
    }
}

#[derive(DeriveIden)]
enum CustodianExecutions {
    Table,
    TaskId,
}
