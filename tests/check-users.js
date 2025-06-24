const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany()
    console.log('数据库中的用户:')
    users.forEach(user => {
      console.log(`- ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}`)
    })
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers() 