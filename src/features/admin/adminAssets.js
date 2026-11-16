const files = import.meta.glob('../../assets/admin/*', { eager: true, query: '?url', import: 'default' });
export const asset = (name) => files[`../../assets/admin/${name}`];
