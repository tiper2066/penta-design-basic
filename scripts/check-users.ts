import { prisma } from '../lib/prisma';

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                image: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        console.log('\n=== 전체 사용자 목록 ===\n');
        console.log(`총 ${users.length}명의 사용자가 있습니다.\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Role: ${user.role}`);
            console.log(`   - Email Verified: ${user.emailVerified || 'NULL'}`);
            console.log(`   - Image: ${user.image || 'NULL'}`);
            console.log(`   - Created At: ${user.createdAt}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
