import {
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MessageCirclePlus, SearchIcon, UserPlus } from "lucide-react";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";

export const Header = () => {
    return (
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem className="flex p-2 items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <img src="public/logo.svg" className="w-6" />
                        </div>
                        <div className="grid flex-1 text-left text-lg leading-tight">
                            <span className="truncate font-bold">MOJI</span>
                        </div>
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
            <div className="pb-2 border-b mb-2">
                <div className="flex items-center gap-1 px-2 py-1 ">
                    <div className="relative grow">
                        <Input
                            id={`input-search`}
                            className="peer h-8 ps-8 pe-2 text-sm"
                            placeholder={"Tìm kiếm..."}
                            type="search"
                            value={""}
                            onChange={() => { }}
                        />
                        <div className="text-white pointer-events-none absolute flex h-full top-0 items-center justify-center ps-2 peer-disabled:opacity-50">
                            <SearchIcon className="text-primary" size={16} />
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                        }}
                    >
                        <MessageCirclePlus />
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                        }}
                    >
                        <UserPlus />
                    </Button>
                </div>

            </div>
        </SidebarHeader>
    )
}