const { PrismaClient } = require("@prisma/client");
async function main() {
  const prisma = new PrismaClient();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  console.log("=== 数据库分类（API格式）===");
  console.log(
    JSON.stringify(
      categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      })),
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}
main()
  .catch(console.error)
  .finally(() => process.exit(0));
