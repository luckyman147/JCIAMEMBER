
interface StrategyItemProps {
    index: number;
    content: string;
    listType: 'ordered' | 'bullet';
}

export const StrategyItem = ({ index, content, listType }: StrategyItemProps) => {
    return (
        <div className="flex gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 group transition-all hover:bg-blue-50/20 hover:border-blue-100/50">
            <div className="shrink-0 w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 text-(--color-myAccent) flex items-center justify-center font-black text-xs">
                {listType === 'ordered' ? index + 1 : '•'}
            </div>
            <p className="text-sm font-medium text-gray-700 leading-relaxed pt-1.5 flex-1">
                {content}
            </p>
        </div>
    );
};
